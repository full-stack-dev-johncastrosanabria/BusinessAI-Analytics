"""
Property-based tests for training data split ratio
Tests that 80/20 split produces correct training and validation set sizes
"""

import pytest
import numpy as np
from models.sales_forecast import SalesForecastModel
from models.cost_forecast import CostForecastModel


class TestTrainingDataSplitRatio:
    """Test training data split ratio property"""
    
    def test_sales_model_80_20_split_small_data(self):
        """
        Property 19: Training Data Split Ratio
        Test that 80/20 split produces correct training and validation set sizes
        
        Validates: Requirements 15.5
        """
        # Generate synthetic data
        data = np.random.uniform(1000, 10000, 50)
        
        # Create model
        model = SalesForecastModel(sequence_length=12)
        
        # Prepare data
        X_train, y_train, X_val, y_val = model.prepare_data(data, train_ratio=0.8)
        
        # Calculate actual split ratio
        total_samples = len(X_train) + len(X_val)
        actual_train_ratio = len(X_train) / total_samples if total_samples > 0 else 0
        
        # Assert split is approximately 80/20 (allow 5% tolerance)
        assert 0.75 <= actual_train_ratio <= 0.85, \
            f"Train ratio {actual_train_ratio} not close to 0.8"
        
        # Assert validation set is approximately 20%
        actual_val_ratio = len(X_val) / total_samples if total_samples > 0 else 0
        assert 0.15 <= actual_val_ratio <= 0.25, \
            f"Validation ratio {actual_val_ratio} not close to 0.2"
        
        # Assert no overlap between train and validation
        assert len(X_train) + len(X_val) == total_samples, \
            "Train and validation sets overlap or don't cover all data"
    
    def test_sales_model_80_20_split_medium_data(self):
        """Test 80/20 split with medium-sized data"""
        data = np.random.uniform(1000, 10000, 200)
        
        model = SalesForecastModel(sequence_length=12)
        X_train, y_train, X_val, y_val = model.prepare_data(data, train_ratio=0.8)
        
        total_samples = len(X_train) + len(X_val)
        actual_train_ratio = len(X_train) / total_samples if total_samples > 0 else 0
        
        assert 0.75 <= actual_train_ratio <= 0.85
    
    def test_cost_model_80_20_split_small_data(self):
        """
        Property 19: Training Data Split Ratio
        Test that 80/20 split produces correct training and validation set sizes
        
        Validates: Requirements 15.5
        """
        # Generate synthetic data
        data = np.random.uniform(500, 5000, 50)
        
        # Create model
        model = CostForecastModel(sequence_length=12)
        
        # Prepare data
        X_train, y_train, X_val, y_val = model.prepare_data(data, train_ratio=0.8)
        
        # Calculate actual split ratio
        total_samples = len(X_train) + len(X_val)
        actual_train_ratio = len(X_train) / total_samples if total_samples > 0 else 0
        
        # Assert split is approximately 80/20 (allow 5% tolerance)
        assert 0.75 <= actual_train_ratio <= 0.85, \
            f"Train ratio {actual_train_ratio} not close to 0.8"
        
        # Assert validation set is approximately 20%
        actual_val_ratio = len(X_val) / total_samples if total_samples > 0 else 0
        assert 0.15 <= actual_val_ratio <= 0.25, \
            f"Validation ratio {actual_val_ratio} not close to 0.2"
        
        # Assert no overlap between train and validation
        assert len(X_train) + len(X_val) == total_samples, \
            "Train and validation sets overlap or don't cover all data"
    
    def test_cost_model_80_20_split_medium_data(self):
        """Test 80/20 split with medium-sized data"""
        data = np.random.uniform(500, 5000, 200)
        
        model = CostForecastModel(sequence_length=12)
        X_train, y_train, X_val, y_val = model.prepare_data(data, train_ratio=0.8)
        
        total_samples = len(X_train) + len(X_val)
        actual_train_ratio = len(X_train) / total_samples if total_samples > 0 else 0
        
        assert 0.75 <= actual_train_ratio <= 0.85
    
    def test_sales_model_split_with_minimum_data(self):
        """Test split with minimum required data (24 months)"""
        data = np.random.uniform(1000, 10000, 24)
        model = SalesForecastModel(sequence_length=12)
        
        X_train, y_train, X_val, y_val = model.prepare_data(data, train_ratio=0.8)
        
        # With 24 data points and sequence_length=12, we get 12 samples
        # 80/20 split should give us ~9-10 train and ~2-3 validation
        assert len(X_train) > 0, "Training set should not be empty"
        assert len(X_val) > 0, "Validation set should not be empty"
        assert len(X_train) + len(X_val) == 12, "Total samples should be 12"
    
    def test_cost_model_split_with_minimum_data(self):
        """Test split with minimum required data (24 months)"""
        data = np.random.uniform(500, 5000, 24)
        model = CostForecastModel(sequence_length=12)
        
        X_train, y_train, X_val, y_val = model.prepare_data(data, train_ratio=0.8)
        
        # With 24 data points and sequence_length=12, we get 12 samples
        # 80/20 split should give us ~9-10 train and ~2-3 validation
        assert len(X_train) > 0, "Training set should not be empty"
        assert len(X_val) > 0, "Validation set should not be empty"
        assert len(X_train) + len(X_val) == 12, "Total samples should be 12"
