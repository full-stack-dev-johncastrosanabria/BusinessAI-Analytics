"""
Hybrid forecasting model combining statistical decomposition with LSTM
This approach explicitly models trend and seasonality before using LSTM for residuals
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
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    nn = None
    optim = None

logger = logging.getLogger(__name__)


class HybridForecastModel:
    """
    Hybrid model that combines:
    1. Trend extraction (linear regression)
    2. Seasonal decomposition (monthly patterns)
    3. LSTM for residuals (capturing remaining patterns)
    """
    
    def __init__(self, sequence_length=12):
        self.sequence_length = sequence_length
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.is_fitted = False
        
        # Trend parameters
        self.trend_slope = 0
        self.trend_intercept = 0
        
        # Seasonal parameters (12 months)
        self.seasonal_factors = np.ones(12)
        
        # LSTM for residuals
        if TORCH_AVAILABLE:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.lstm_model = SimpleLSTM(input_size=1, hidden_size=32, num_layers=2)
            self.lstm_model.to(self.device)
        else:
            self.device = None
            self.lstm_model = None
    
    def decompose_series(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Decompose time series into trend, seasonal, and residual components
        
        Returns:
            trend, seasonal, residual arrays
        """
        n = len(data)
        
        # 1. Extract trend using linear regression
        x = np.arange(n)
        self.trend_slope, self.trend_intercept = np.polyfit(x, data, 1)
        trend = self.trend_slope * x + self.trend_intercept
        
        # 2. Detrend the data
        detrended = data - trend
        
        # 3. Extract seasonal component (average for each month)
        seasonal = np.zeros(n)
        for month in range(12):
            # Get all values for this month
            month_indices = [i for i in range(n) if i % 12 == month]
            if month_indices:
                month_values = detrended[month_indices]
                self.seasonal_factors[month] = np.mean(month_values)
        
        # Apply seasonal factors
        for i in range(n):
            seasonal[i] = self.seasonal_factors[i % 12]
        
        # 4. Calculate residuals
        residual = detrended - seasonal
        
        logger.info(f"Decomposition - Trend slope: {self.trend_slope:.2f}, Seasonal range: [{self.seasonal_factors.min():.2f}, {self.seasonal_factors.max():.2f}]")
        
        return trend, seasonal, residual
    
    def _prepare_lstm_data(self, residual):
        """Prepare residual data for LSTM training."""
        residual_normalized = self.scaler.fit_transform(
            residual.reshape(-1, 1)
        ).flatten()

        # Create sequences for LSTM
        x_list, y_list = [], []
        for i in range(len(residual_normalized) - self.sequence_length):
            x_list.append(residual_normalized[i:i + self.sequence_length])
            y_list.append(residual_normalized[i + self.sequence_length])

        x_arr = np.array(x_list).reshape(-1, self.sequence_length, 1)
        y_arr = np.array(y_list).reshape(-1, 1)

        # Split train/val
        split = int(0.8 * len(x_arr))
        x_train, x_val = x_arr[:split], x_arr[split:]
        y_train, y_val = y_arr[:split], y_arr[split:]

        return x_train, y_train, x_val, y_val

    def _train_lstm_model(self, x_train, y_train, x_val, y_val, epochs):
        """Train LSTM model on residuals."""
        x_train_t = torch.FloatTensor(x_train).to(self.device)
        y_train_t = torch.FloatTensor(y_train).to(self.device)
        x_val_t = torch.FloatTensor(x_val).to(self.device)
        y_val_t = torch.FloatTensor(y_val).to(self.device)

        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.lstm_model.parameters(), lr=0.001)

        best_val_loss = float('inf')
        patience = 0

        for epoch in range(epochs):
            self.lstm_model.train()
            optimizer.zero_grad()

            outputs = self.lstm_model(x_train_t)
            loss = criterion(outputs, y_train_t)
            loss.backward()
            optimizer.step()

            # Validation
            self.lstm_model.eval()
            with torch.no_grad():
                val_outputs = self.lstm_model(x_val_t)
                val_loss = criterion(val_outputs, y_val_t).item()

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience = 0
            else:
                patience += 1
                if patience >= 15:
                    break

            if (epoch + 1) % 20 == 0:
                logger.info(
                    "Epoch %d/%d, Train Loss: %.6f, Val Loss: %.6f",
                    epoch + 1, epochs, loss.item(), val_loss
                )

    def train(self, data: np.ndarray, epochs: int = 100) -> float:
        """
        Train the hybrid model

        Args:
            data: Historical time series data
            epochs: Number of epochs for LSTM training

        Returns:
            MAPE on validation set
        """
        if not TORCH_AVAILABLE:
            logger.warning(
                "PyTorch not available, using statistical model only"
            )
            self.decompose_series(data)
            self.is_fitted = True
            return self._calculate_mape(data)

        # Decompose the series
        trend, seasonal, residual = self.decompose_series(data)

        # Prepare and train LSTM on residuals
        x_train, y_train, x_val, y_val = self._prepare_lstm_data(residual)
        self._train_lstm_model(x_train, y_train, x_val, y_val, epochs)

        self.is_fitted = True
        mape = self._calculate_mape(data)
        logger.info("Hybrid model trained. MAPE: %.2f%%", mape)

        return mape
    
    def forecast(self, data: np.ndarray, steps: int = 12) -> Tuple[np.ndarray, float]:
        """
        Generate forecast
        
        Args:
            data: Historical data
            steps: Number of steps to forecast
            
        Returns:
            predictions, mape
        """
        if not self.is_fitted:
            self.train(data)
        
        n = len(data)
        predictions = []
        
        # Get components from historical data
        trend, seasonal, residual = self.decompose_series(data)
        
        for step in range(steps):
            future_idx = n + step
            
            # 1. Project trend
            trend_value = self.trend_slope * future_idx + self.trend_intercept
            
            # 2. Get seasonal component
            seasonal_value = self.seasonal_factors[future_idx % 12]
            
            # 3. Predict residual with LSTM (or use mean if no LSTM)
            if TORCH_AVAILABLE and self.lstm_model is not None:
                # Use last sequence_length residuals
                recent_residuals = residual[-(self.sequence_length):]
                residual_norm = self.scaler.transform(recent_residuals.reshape(-1, 1)).flatten()
                
                X_input = torch.FloatTensor(residual_norm).reshape(1, self.sequence_length, 1).to(self.device)
                
                self.lstm_model.eval()
                with torch.no_grad():
                    residual_pred_norm = self.lstm_model(X_input).cpu().numpy()[0, 0]
                
                residual_pred = self.scaler.inverse_transform([[residual_pred_norm]])[0, 0]
                
                # Update residual history for next prediction
                residual = np.append(residual, residual_pred)
            else:
                residual_pred = 0  # No residual prediction without LSTM
            
            # 4. Combine components
            prediction = trend_value + seasonal_value + residual_pred
            predictions.append(max(0, prediction))  # Ensure non-negative
        
        predictions = np.array(predictions)
        mape = self._calculate_mape(data)
        
        return predictions, mape
    
    def _calculate_mape(self, data: np.ndarray) -> float:
        """Calculate MAPE on the last 20% of data"""
        n = len(data)
        split = int(0.8 * n)
        
        # Reconstruct predictions for validation set
        trend, seasonal, residual = self.decompose_series(data)
        reconstructed = trend + seasonal
        
        if TORCH_AVAILABLE and self.lstm_model is not None:
            # Add LSTM residual predictions
            residual_normalized = self.scaler.transform(residual.reshape(-1, 1)).flatten()
            
            for i in range(split, n):
                if i >= self.sequence_length:
                    X_input = residual_normalized[i-self.sequence_length:i].reshape(1, self.sequence_length, 1)
                    X_input_t = torch.FloatTensor(X_input).to(self.device)
                    
                    self.lstm_model.eval()
                    with torch.no_grad():
                        pred_norm = self.lstm_model(X_input_t).cpu().numpy()[0, 0]
                    
                    pred = self.scaler.inverse_transform([[pred_norm]])[0, 0]
                    reconstructed[i] += pred
        
        # Calculate MAPE on validation set
        actual = data[split:]
        predicted = reconstructed[split:]
        
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        return mape
    
    def save_model(self, path: str):
        """Save model parameters"""
        state = {
            'trend_slope': self.trend_slope,
            'trend_intercept': self.trend_intercept,
            'seasonal_factors': self.seasonal_factors,
            'scaler_scale': self.scaler.scale_ if hasattr(self.scaler, 'scale_') else None,
            'scaler_min': self.scaler.min_ if hasattr(self.scaler, 'min_') else None,
        }
        
        if TORCH_AVAILABLE and self.lstm_model is not None:
            state['lstm_state_dict'] = self.lstm_model.state_dict()
        
        torch.save(state, path)
        logger.info(f"Hybrid model saved to {path}")
    
    def load_model(self, path: str):
        """Load model parameters"""
        state = torch.load(path, map_location=self.device if self.device else 'cpu', weights_only=False)
        
        self.trend_slope = state['trend_slope']
        self.trend_intercept = state['trend_intercept']
        self.seasonal_factors = state['seasonal_factors']
        
        if state['scaler_scale'] is not None:
            # Fit scaler with dummy data then set parameters
            self.scaler.fit(np.array([[0], [1]]))
            self.scaler.scale_ = state['scaler_scale']
            self.scaler.min_ = state['scaler_min']
        
        if 'lstm_state_dict' in state and self.lstm_model is not None:
            self.lstm_model.load_state_dict(state['lstm_state_dict'])
        
        self.is_fitted = True
        logger.info(f"Hybrid model loaded from {path}")


class SimpleLSTM(nn.Module):
    """Simple LSTM for residual prediction"""
    
    def __init__(self, input_size=1, hidden_size=32, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, 1)
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_output = lstm_out[:, -1, :]
        return self.fc(last_output)
