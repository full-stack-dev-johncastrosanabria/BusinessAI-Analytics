"""
TensorFlow LSTM model for cost forecasting
"""

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    tf = None
    keras = None
    layers = None

import numpy as np
import logging
from typing import Tuple
from sklearn.preprocessing import MinMaxScaler

logger = logging.getLogger(__name__)


class CostForecastModel:
    """TensorFlow LSTM model for cost forecasting with 2 layers"""
    
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1, sequence_length=12):
        """
        Initialize the cost forecast model
        
        Args:
            input_size: Number of input features (1 for univariate)
            hidden_size: Number of hidden units in LSTM layers
            num_layers: Number of LSTM layers
            output_size: Number of output features (1 for single value prediction)
            sequence_length: Length of input sequences
        """
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.sequence_length = sequence_length
        self.output_size = output_size
        
        # Scaler for normalization
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.is_fitted = False
        
        # Build model (only if TensorFlow is available)
        if TENSORFLOW_AVAILABLE:
            self.model = self._build_model()
        else:
            self.model = None
            logger.warning("TensorFlow not available. Model training/forecasting will not work.")
        
        logger.info("Cost model initialized")
    
    def _build_model(self):
        """
        Build the TensorFlow LSTM model
        
        Returns:
            Compiled Keras model
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Cannot build model.")
        
        model = keras.Sequential([
            layers.LSTM(
                self.hidden_size,
                return_sequences=True,
                input_shape=(self.sequence_length, 1),
                dropout=0.2
            ),
            layers.LSTM(
                self.hidden_size,
                dropout=0.2
            ),
            layers.Dense(self.output_size)
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        logger.info("Model architecture built")
        return model
    
    def prepare_data(self, data: np.ndarray, train_ratio: float = 0.8) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare data for training with 80/20 split
        
        Args:
            data: Historical cost data
            train_ratio: Ratio for train/validation split
        
        Returns:
            Tuple of (X_train, y_train, X_val, y_val)
        """
        # Normalize data
        data_normalized = self.scaler.fit_transform(data.reshape(-1, 1))
        self.is_fitted = True
        
        # Create sequences
        X, y = [], []
        for i in range(len(data_normalized) - self.sequence_length):
            X.append(data_normalized[i:i + self.sequence_length])
            y.append(data_normalized[i + self.sequence_length])
        
        X = np.array(X)
        y = np.array(y)
        
        # Split into train and validation
        split_idx = int(len(X) * train_ratio)
        X_train, X_val = X[:split_idx], X[split_idx:]
        y_train, y_val = y[:split_idx], y[split_idx:]
        
        logger.info(f"Data prepared: train={len(X_train)}, validation={len(X_val)}")
        
        return X_train, y_train, X_val, y_val
    
    def train_model(self, data: np.ndarray, epochs: int = 50, batch_size: int = 16) -> float:
        """
        Train the model
        
        Args:
            data: Historical cost data
            epochs: Number of training epochs
            batch_size: Batch size for training
        
        Returns:
            Mean Absolute Percentage Error on validation set
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Cannot train model.")
        
        # Prepare data
        X_train, y_train, X_val, y_val = self.prepare_data(data)
        
        # Train model
        self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            verbose=0
        )
        
        # Calculate MAPE on validation set
        val_predictions = self.model.predict(X_val, verbose=0)
        mape = self._calculate_mape(y_val, val_predictions)
        
        logger.info(f"Training complete. Validation MAPE: {mape:.4f}")
        
        return mape
    
    def forecast(self, data: np.ndarray, forecast_steps: int = 12) -> Tuple[np.ndarray, float]:
        """
        Generate forecast for next N months
        
        Args:
            data: Historical cost data
            forecast_steps: Number of months to forecast (default 12)
        
        Returns:
            Tuple of (predictions, mape)
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Cannot generate forecast.")
        
        if not self.is_fitted:
            logger.warning("Model not fitted, fitting with provided data")
            self.train_model(data)
        
        # Normalize data
        data_normalized = self.scaler.transform(data.reshape(-1, 1))
        
        # Use last sequence_length points as starting point
        current_sequence = data_normalized[-self.sequence_length:].reshape(1, self.sequence_length, 1)
        
        # Generate forecast
        predictions = []
        for _ in range(forecast_steps):
            next_pred = self.model.predict(current_sequence, verbose=0)[0, 0]
            predictions.append(next_pred)
            
            # Update sequence for next prediction
            current_sequence = np.append(current_sequence[:, 1:, :], 
                                        np.array([[[next_pred]]]), axis=1)
        
        # Denormalize predictions
        predictions = np.array(predictions).reshape(-1, 1)
        predictions_denormalized = self.scaler.inverse_transform(predictions).flatten()
        
        # Calculate MAPE on validation set
        _, _, X_val, y_val = self.prepare_data(data)
        val_predictions = self.model.predict(X_val, verbose=0)
        mape = self._calculate_mape(y_val, val_predictions)
        
        logger.info(f"Generated {forecast_steps}-month forecast")
        return predictions_denormalized, mape
    
    def _calculate_mape(self, y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        Calculate Mean Absolute Percentage Error
        
        Args:
            y_true: True values (normalized)
            y_pred: Predicted values (normalized)
        
        Returns:
            MAPE value
        """
        # Denormalize for MAPE calculation
        y_true_denorm = self.scaler.inverse_transform(y_true)
        y_pred_denorm = self.scaler.inverse_transform(y_pred)
        
        mape = np.mean(np.abs((y_true_denorm - y_pred_denorm) / y_true_denorm)) * 100
        return float(mape)
    
    def save_model(self, path: str):
        """
        Save model weights and scaler
        
        Args:
            path: Path to save model
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Cannot save model.")
        try:
            self.model.save(path)
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    def load_model(self, path: str):
        """
        Load model weights
        
        Args:
            path: Path to load model from
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Cannot load model.")
        try:
            self.model = keras.models.load_model(path)
            self.is_fitted = True
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def train(self, data: np.ndarray) -> float:
        """
        Public training method for compatibility
        
        Args:
            data: Historical data
        
        Returns:
            MAPE metric
        """
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow is not available. Cannot train model.")
        return self.train_model(data)
