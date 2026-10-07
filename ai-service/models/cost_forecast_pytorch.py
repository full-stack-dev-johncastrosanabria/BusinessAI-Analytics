"""
PyTorch LSTM model for cost forecasting
Compatible with Python 3.14 - replaces TensorFlow implementation
"""

import logging
from typing import Tuple

import numpy as np
from sklearn.preprocessing import MinMaxScaler

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    TORCH_AVAILABLE = True
    _BaseModule = nn.Module
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    nn = None
    optim = None
    _BaseModule = object

logger = logging.getLogger(__name__)


class CostForecastModelPyTorch(_BaseModule):
    """Optimized PyTorch LSTM model for cost forecasting - balanced for small datasets"""

    def __init__(self, input_size=1, hidden_size=128, num_layers=3,
                 output_size=1, sequence_length=12):
        """
        Initialize the cost forecast model with optimized architecture
        
        Optimizations for small datasets (60-100 samples):
        1. Moderate depth: 3 LSTM layers (not too deep)
        2. Balanced width: 128 hidden units (not too wide)
        3. Standard sequences: 12 months (not too long)
        4. Attention mechanism: Focus on important patterns
        5. Regularization: Prevent overfitting on small data

        Args:
            input_size: Number of input features (1 for univariate)
            hidden_size: Number of hidden units in LSTM layers (128)
            num_layers: Number of LSTM layers (3)
            output_size: Number of output features
            sequence_length: Length of input sequences (12)
        """
        if TORCH_AVAILABLE:
            super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.sequence_length = sequence_length

        # Scaler for normalization
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.is_fitted = False

        if TORCH_AVAILABLE:
            # Balanced LSTM with 3 layers
            self.lstm = nn.LSTM(
                input_size=input_size,
                hidden_size=hidden_size,
                num_layers=num_layers,
                batch_first=True,
                dropout=0.2 if num_layers > 1 else 0,
                bidirectional=False
            )
            
            # Simple attention mechanism
            self.attention = nn.Sequential(
                nn.Linear(hidden_size, hidden_size // 4),
                nn.Tanh(),
                nn.Linear(hidden_size // 4, 1)
            )
            
            # Layer normalization for stability
            self.layer_norm1 = nn.LayerNorm(hidden_size)
            self.layer_norm2 = nn.LayerNorm(hidden_size // 2)
            
            # Fully connected layers
            self.fc1 = nn.Linear(hidden_size, hidden_size // 2)
            self.fc2 = nn.Linear(hidden_size // 2, hidden_size // 4)
            self.fc3 = nn.Linear(hidden_size // 4, output_size)
            
            # Activation and regularization
            self.relu = nn.ReLU()
            self.elu = nn.ELU()
            self.dropout1 = nn.Dropout(0.2)
            self.dropout2 = nn.Dropout(0.15)
            
            # Device
            self.device = torch.device(
                "cuda" if torch.cuda.is_available() else "cpu"
            )
            self.to(self.device)
            logger.info("Cost model (Optimized) initialized on device: %s",
                       self.device)
        else:
            self.device = None
            logger.warning(
                "PyTorch not available. Model training/forecasting will not work."
            )

    def forward(self, x):
        """
        Forward pass with attention mechanism and residual connections

        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)

        Returns:
            Output tensor of shape (batch_size, output_size)
        """
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is not available.")
        
        # LSTM processing
        lstm_out, _ = self.lstm(x)  # (batch, seq_len, hidden_size)
        
        # Attention mechanism
        attention_weights = self.attention(lstm_out)  # (batch, seq_len, 1)
        attention_weights = torch.softmax(attention_weights, dim=1)
        
        # Apply attention
        context = torch.sum(attention_weights * lstm_out, dim=1)  # (batch, hidden_size)
        
        # Layer normalization
        context = self.layer_norm1(context)
        
        # First FC layer with residual connection
        x1 = self.fc1(context)
        x1 = self.elu(x1)
        x1 = self.dropout1(x1)
        x1 = self.layer_norm2(x1)
        
        # Second FC layer
        x2 = self.fc2(x1)
        x2 = self.relu(x2)
        x2 = self.dropout2(x2)
        
        # Final prediction
        predictions = self.fc3(x2)
        return predictions

    def prepare_data(
        self, data: np.ndarray, train_ratio: float = 0.8
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
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
        x_list, y_list = [], []
        for i in range(len(data_normalized) - self.sequence_length):
            x_list.append(data_normalized[i:i + self.sequence_length])
            y_list.append(data_normalized[i + self.sequence_length])

        x_arr = np.array(x_list)
        y_arr = np.array(y_list)

        # Split into train and validation
        split_idx = int(len(x_arr) * train_ratio)
        x_train, x_val = x_arr[:split_idx], x_arr[split_idx:]
        y_train, y_val = y_arr[:split_idx], y_arr[split_idx:]

        logger.info(
            "Data prepared: train=%d, validation=%d",
            len(x_train), len(x_val)
        )

        return x_train, y_train, x_val, y_val

    def _setup_training_components(
        self, learning_rate: float, epochs: int
    ):
        """Setup optimizer, loss function, and scheduler."""
        criterion = nn.SmoothL1Loss()
        optimizer = optim.AdamW(
            self.parameters(), lr=learning_rate, weight_decay=1e-3
        )
        scheduler = optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=epochs, eta_min=1e-5
        )
        return criterion, optimizer, scheduler

    def _train_single_epoch(
        self, x_train_t, y_train_t, batch_size, criterion, optimizer
    ):
        """Train for one epoch and return average loss."""
        epoch_loss = 0
        n_batches = 0

        for i in range(0, len(x_train_t), batch_size):
            batch_x = x_train_t[i:i + batch_size]
            batch_y = y_train_t[i:i + batch_size]

            outputs = self(batch_x)
            loss = criterion(outputs, batch_y)

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.parameters(), max_norm=1.0)
            optimizer.step()

            epoch_loss += loss.item()
            n_batches += 1

        return epoch_loss / max(1, n_batches)

    def _validate_model(self, x_val_t, y_val_t, criterion):
        """Run validation and return validation loss."""
        self.eval()
        with torch.no_grad():
            val_outputs = self(x_val_t)
            val_loss = criterion(val_outputs, y_val_t).item()
        nn.Module.train(self)
        return val_loss

    def _update_best_model(self, val_loss, best_val_loss, best_model_state):
        """Update best model if validation loss improved."""
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = {
                k: v.cpu().clone() for k, v in self.state_dict().items()
            }
            patience_counter = 0
        else:
            patience_counter = 1
        return best_val_loss, best_model_state, patience_counter

    def train_model(
        self, data: np.ndarray, epochs: int = 150,
        batch_size: int = 8, learning_rate: float = 0.001
    ) -> float:
        """
        Train the model with optimized strategy for small datasets

        Optimizations:
        1. Moderate epochs: 150 for good convergence without overfitting
        2. Small batches: 8 for maximum gradient updates
        3. Higher learning rate: 0.001 for faster convergence
        4. Cosine annealing: Smooth learning rate decay
        5. Strong regularization: Prevent overfitting on small data

        Args:
            data: Historical cost data
            epochs: Number of training epochs (150)
            batch_size: Batch size for training (8)
            learning_rate: Learning rate for optimizer (0.001)

        Returns:
            Mean Absolute Percentage Error on validation set
        """
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is not available. Cannot train model.")

        x_train, y_train, x_val, y_val = self.prepare_data(data)

        x_train_t = torch.FloatTensor(x_train).to(self.device)
        y_train_t = torch.FloatTensor(y_train).to(self.device)
        x_val_t = torch.FloatTensor(x_val).to(self.device)
        y_val_t = torch.FloatTensor(y_val).to(self.device)

        criterion, optimizer, scheduler = self._setup_training_components(
            learning_rate, epochs
        )

        best_val_loss = float('inf')
        best_model_state = None
        patience_counter = 0
        early_stop_patience = 25

        nn.Module.train(self)
        for epoch in range(epochs):
            avg_loss = self._train_single_epoch(
                x_train_t, y_train_t, batch_size, criterion, optimizer
            )

            val_loss = self._validate_model(x_val_t, y_val_t, criterion)
            scheduler.step()

            best_val_loss, best_model_state, patience_inc = (
                self._update_best_model(
                    val_loss, best_val_loss, best_model_state
                )
            )
            patience_counter += patience_inc

            if patience_counter >= early_stop_patience:
                logger.info("Early stopping at epoch %d", epoch + 1)
                break

            if (epoch + 1) % 15 == 0:
                current_lr = optimizer.param_groups[0]['lr']
                logger.info(
                    "Epoch %d/%d, Train Loss: %.6f, Val Loss: %.6f, "
                    "LR: %.6f",
                    epoch + 1, epochs, avg_loss, val_loss, current_lr
                )

        if best_model_state is not None:
            self.load_state_dict(
                {k: v.to(self.device) for k, v in best_model_state.items()}
            )
            logger.info(
                "Loaded best model from epoch with val_loss: %.6f",
                best_val_loss
            )

        self.eval()
        with torch.no_grad():
            val_predictions = self(x_val_t)
            val_mape = self._calculate_mape(y_val_t, val_predictions)
            logger.info("Final Validation MAPE: %.4f%%", val_mape)

        return val_mape

    def forecast(
        self, data: np.ndarray, forecast_steps: int = 12
    ) -> Tuple[np.ndarray, float]:
        """
        Generate forecast for next N months

        Args:
            data: Historical cost data
            forecast_steps: Number of months to forecast (default 12)

        Returns:
            Tuple of (predictions, mape)
        """
        if not TORCH_AVAILABLE:
            raise ImportError(
                "PyTorch is not available. Cannot generate forecast."
            )

        if not self.is_fitted:
            logger.warning("Model not fitted, fitting with provided data")
            self.train_model(data)

        data_normalized = self.scaler.transform(data.reshape(-1, 1))

        current_sequence = data_normalized[-self.sequence_length:].reshape(
            1, self.sequence_length, 1
        )
        current_sequence_t = torch.FloatTensor(current_sequence).to(self.device)

        predictions = []
        self.eval()
        with torch.no_grad():
            for _ in range(forecast_steps):
                next_pred = self(current_sequence_t)
                predictions.append(next_pred.item())

                current_sequence = np.append(
                    current_sequence[:, 1:, :],
                    next_pred.cpu().numpy().reshape(1, 1, 1),
                    axis=1
                )
                current_sequence_t = torch.FloatTensor(
                    current_sequence
                ).to(self.device)

        predictions_arr = np.array(predictions).reshape(-1, 1)
        predictions_denorm = self.scaler.inverse_transform(
            predictions_arr
        ).flatten()

        _, _, x_val, y_val = self.prepare_data(data)
        x_val_t = torch.FloatTensor(x_val).to(self.device)
        y_val_t = torch.FloatTensor(y_val).to(self.device)

        with torch.no_grad():
            val_predictions = self(x_val_t)
            mape = self._calculate_mape(y_val_t, val_predictions)

        logger.info("Generated %d-month forecast", forecast_steps)
        return predictions_denorm, mape

    def _calculate_mape(
        self, y_true: "torch.Tensor", y_pred: "torch.Tensor"
    ) -> float:
        """
        Calculate Mean Absolute Percentage Error

        Args:
            y_true: True values
            y_pred: Predicted values

        Returns:
            MAPE value
        """
        y_true_denorm = torch.FloatTensor(
            self.scaler.inverse_transform(y_true.cpu().numpy())
        ).to(self.device)
        y_pred_denorm = torch.FloatTensor(
            self.scaler.inverse_transform(y_pred.cpu().numpy())
        ).to(self.device)

        mape = (
            torch.mean(
                torch.abs((y_true_denorm - y_pred_denorm) / y_true_denorm)
            ) * 100
        )
        return mape.item()

    def save_model(self, path: str):
        """
        Save model weights and scaler

        Args:
            path: Path to save model
        """
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is not available. Cannot save model.")
        try:
            torch.save({
                'model_state_dict': self.state_dict(),
                'scaler_data': {
                    'scale_': self.scaler.scale_,
                    'min_': self.scaler.min_,
                    'data_min_': self.scaler.data_min_,
                    'data_max_': self.scaler.data_max_,
                    'data_range_': self.scaler.data_range_
                }
            }, path)
            logger.info("Model saved to %s", path)
        except Exception as e:
            logger.error("Error saving model: %s", e)
            raise

    def load_model(self, path: str):
        """
        Load model weights and scaler

        Args:
            path: Path to load model from
        """
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is not available. Cannot load model.")
        try:
            checkpoint = torch.load(path, map_location=self.device, weights_only=False)
            self.load_state_dict(checkpoint['model_state_dict'])

            # Properly restore scaler by fitting with dummy data first
            scaler_data = checkpoint['scaler_data']
            # Create a dummy array to fit the scaler
            dummy_min = scaler_data['data_min_'][0]
            dummy_max = scaler_data['data_max_'][0]
            dummy_data = np.array([[dummy_min], [dummy_max]])
            self.scaler.fit(dummy_data)
            
            # Now set the saved parameters
            self.scaler.scale_ = scaler_data['scale_']
            self.scaler.min_ = scaler_data['min_']
            self.scaler.data_min_ = scaler_data['data_min_']
            self.scaler.data_max_ = scaler_data['data_max_']
            self.scaler.data_range_ = scaler_data['data_range_']
            self.is_fitted = True

            logger.info("Model loaded from %s", path)
        except Exception as e:
            logger.error("Error loading model: %s", e)
            raise

    def train_from_data(self, data: np.ndarray) -> float:
        """
        Public training method for compatibility.
        Trains the model using historical data.

        Args:
            data: Historical data

        Returns:
            MAPE metric
        """
        return self.train_model(data)
