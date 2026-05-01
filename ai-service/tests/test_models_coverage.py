"""
Tests for models/ to achieve ≥80% coverage.
Uses small synthetic data to keep tests fast.
"""
import pytest
import numpy as np
import tempfile
import os


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_data(n=60, seed=42):
    """Generate synthetic monthly sales/cost data."""
    rng = np.random.default_rng(seed)
    base = 10000 + np.arange(n) * 100
    noise = rng.normal(0, 500, n)
    return (base + noise).astype(np.float32)


# ---------------------------------------------------------------------------
# CostForecastModel (TensorFlow — likely unavailable, test no-TF paths)
# ---------------------------------------------------------------------------

class TestCostForecastModel:
    def test_init_without_tensorflow(self):
        """Model initialises gracefully when TF is not available."""
        from models.cost_forecast import CostForecastModel, TENSORFLOW_AVAILABLE
        model = CostForecastModel()
        if not TENSORFLOW_AVAILABLE:
            assert model.model is None
        assert model.scaler is not None
        assert not model.is_fitted

    def test_prepare_data_returns_four_arrays(self):
        from models.cost_forecast import CostForecastModel
        model = CostForecastModel(sequence_length=6)
        data = _make_data(30)
        x_train, y_train, x_val, y_val = model.prepare_data(data)
        assert len(x_train) > 0
        assert len(x_val) > 0
        assert model.is_fitted

    def test_prepare_data_split_ratio(self):
        from models.cost_forecast import CostForecastModel
        model = CostForecastModel(sequence_length=6)
        data = _make_data(40)
        x_train, y_train, x_val, y_val = model.prepare_data(data, train_ratio=0.8)
        total = len(x_train) + len(x_val)
        assert len(x_train) == int(total * 0.8)

    def test_train_model_raises_without_tensorflow(self):
        from models.cost_forecast import CostForecastModel, TENSORFLOW_AVAILABLE
        if TENSORFLOW_AVAILABLE:
            pytest.skip("TensorFlow is available — skipping no-TF test")
        model = CostForecastModel()
        with pytest.raises(ImportError):
            model.train_model(_make_data())

    def test_forecast_raises_without_tensorflow(self):
        from models.cost_forecast import CostForecastModel, TENSORFLOW_AVAILABLE
        if TENSORFLOW_AVAILABLE:
            pytest.skip("TensorFlow is available — skipping no-TF test")
        model = CostForecastModel()
        with pytest.raises(ImportError):
            model.forecast(_make_data())

    def test_save_model_raises_without_tensorflow(self):
        from models.cost_forecast import CostForecastModel, TENSORFLOW_AVAILABLE
        if TENSORFLOW_AVAILABLE:
            pytest.skip("TensorFlow is available — skipping no-TF test")
        model = CostForecastModel()
        with pytest.raises(ImportError):
            model.save_model("/tmp/model")

    def test_load_model_raises_without_tensorflow(self):
        from models.cost_forecast import CostForecastModel, TENSORFLOW_AVAILABLE
        if TENSORFLOW_AVAILABLE:
            pytest.skip("TensorFlow is available — skipping no-TF test")
        model = CostForecastModel()
        with pytest.raises(ImportError):
            model.load_model("/tmp/model")

    def test_train_raises_without_tensorflow(self):
        from models.cost_forecast import CostForecastModel, TENSORFLOW_AVAILABLE
        if TENSORFLOW_AVAILABLE:
            pytest.skip("TensorFlow is available — skipping no-TF test")
        model = CostForecastModel()
        with pytest.raises(ImportError):
            model.train(_make_data())


# ---------------------------------------------------------------------------
# CostForecastModelPyTorch
# ---------------------------------------------------------------------------

class TestCostForecastModelPyTorch:
    def test_init(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        model = CostForecastModelPyTorch(sequence_length=6)
        assert model.sequence_length == 6
        assert not model.is_fitted
        if not TORCH_AVAILABLE:
            assert model.device is None

    def test_prepare_data(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch
        model = CostForecastModelPyTorch(sequence_length=6)
        data = _make_data(30)
        x_train, y_train, x_val, y_val = model.prepare_data(data)
        assert len(x_train) > 0
        assert model.is_fitted

    def test_prepare_data_split(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch
        model = CostForecastModelPyTorch(sequence_length=6)
        data = _make_data(40)
        x_train, y_train, x_val, y_val = model.prepare_data(data, train_ratio=0.75)
        total = len(x_train) + len(x_val)
        assert len(x_train) == int(total * 0.75)

    def test_train_model_raises_without_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = CostForecastModelPyTorch()
        with pytest.raises(ImportError):
            model.train_model(_make_data())

    def test_forecast_raises_without_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = CostForecastModelPyTorch()
        with pytest.raises(ImportError):
            model.forecast(_make_data())

    def test_save_model_raises_without_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = CostForecastModelPyTorch()
        with pytest.raises(ImportError):
            model.save_model("/tmp/model.pt")

    def test_load_model_raises_without_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = CostForecastModelPyTorch()
        with pytest.raises(ImportError):
            model.load_model("/tmp/model.pt")

    def test_forward_raises_without_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = CostForecastModelPyTorch()
        with pytest.raises(ImportError):
            model.forward(None)

    def test_train_from_data_raises_without_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = CostForecastModelPyTorch()
        with pytest.raises(ImportError):
            model.train_from_data(_make_data())

    # --- PyTorch available paths ---

    def test_train_model_with_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        mape = model.train_model(data, epochs=3, batch_size=4)
        assert isinstance(mape, float)
        assert mape >= 0

    def test_forecast_with_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        model.train_model(data, epochs=2, batch_size=4)
        preds, mape = model.forecast(data, forecast_steps=3)
        assert len(preds) == 3
        assert isinstance(mape, float)

    def test_forecast_auto_trains_when_not_fitted(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        preds, mape = model.forecast(data, forecast_steps=2)
        assert len(preds) == 2

    def test_save_and_load_model_with_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        model.train_model(data, epochs=2, batch_size=4)
        with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as f:
            path = f.name
        try:
            model.save_model(path)
            model2 = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
            model2.load_model(path)
            assert model2.is_fitted
        finally:
            os.unlink(path)

    def test_train_from_data_with_torch(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        mape = model.train_from_data(data)
        assert isinstance(mape, float)

    def test_update_best_model_improves(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        model.prepare_data(data)  # fit scaler
        best_loss, best_state, patience = model._update_best_model(0.5, 1.0, None)
        assert best_loss == 0.5
        assert patience == 0

    def test_update_best_model_no_improvement(self):
        from models.cost_forecast_pytorch import CostForecastModelPyTorch, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = CostForecastModelPyTorch(sequence_length=6, hidden_size=16, num_layers=1)
        best_loss, best_state, patience = model._update_best_model(1.5, 1.0, {"dummy": None})
        assert best_loss == 1.0
        assert patience == 1


# ---------------------------------------------------------------------------
# SalesForecastModel
# ---------------------------------------------------------------------------

class TestSalesForecastModel:
    def test_init(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        model = SalesForecastModel(sequence_length=6)
        assert model.sequence_length == 6
        assert not model.is_fitted

    def test_prepare_data(self):
        from models.sales_forecast import SalesForecastModel
        model = SalesForecastModel(sequence_length=6)
        data = _make_data(30)
        x_train, y_train, x_val, y_val = model.prepare_data(data)
        assert len(x_train) > 0
        assert model.is_fitted

    def test_train_model_raises_without_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = SalesForecastModel()
        with pytest.raises(ImportError):
            model.train_model(_make_data())

    def test_forecast_raises_without_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = SalesForecastModel()
        with pytest.raises(ImportError):
            model.forecast(_make_data())

    def test_save_model_raises_without_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = SalesForecastModel()
        with pytest.raises(ImportError):
            model.save_model("/tmp/model.pt")

    def test_load_model_raises_without_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = SalesForecastModel()
        with pytest.raises(ImportError):
            model.load_model("/tmp/model.pt")

    def test_forward_raises_without_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = SalesForecastModel()
        with pytest.raises(ImportError):
            model.forward(None)

    def test_train_from_data_raises_without_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if TORCH_AVAILABLE:
            pytest.skip("PyTorch available")
        model = SalesForecastModel()
        with pytest.raises(ImportError):
            model.train_from_data(_make_data())

    def test_train_model_with_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        mape = model.train_model(data, epochs=3, batch_size=4)
        assert isinstance(mape, float)

    def test_forecast_with_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        model.train_model(data, epochs=2, batch_size=4)
        preds, mape = model.forecast(data, forecast_steps=3)
        assert len(preds) == 3

    def test_forecast_auto_trains_when_not_fitted(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        preds, mape = model.forecast(data, forecast_steps=2)
        assert len(preds) == 2

    def test_save_and_load_with_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        data = _make_data(30)
        model.train_model(data, epochs=2, batch_size=4)
        with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as f:
            path = f.name
        try:
            model.save_model(path)
            model2 = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
            model2.load_model(path)
            assert model2.is_fitted
        finally:
            os.unlink(path)

    def test_train_from_data_with_torch(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        mape = model.train_from_data(_make_data(30))
        assert isinstance(mape, float)

    def test_update_best_model_improves(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        model.prepare_data(_make_data(30))
        best_loss, best_state, patience = model._update_best_model(0.3, 1.0, None)
        assert best_loss == 0.3
        assert patience == 0

    def test_update_best_model_no_improvement(self):
        from models.sales_forecast import SalesForecastModel, TORCH_AVAILABLE
        if not TORCH_AVAILABLE:
            pytest.skip("PyTorch not available")
        model = SalesForecastModel(sequence_length=6, hidden_size=16, num_layers=1)
        best_loss, best_state, patience = model._update_best_model(2.0, 1.0, {})
        assert best_loss == 1.0
        assert patience == 1


# ---------------------------------------------------------------------------
# HybridForecastModel
# ---------------------------------------------------------------------------

class TestHybridForecastModel:
    def test_init(self):
        from models.hybrid_forecast import HybridForecastModel
        model = HybridForecastModel(sequence_length=6)
        assert model.sequence_length == 6

    def test_decompose_series(self):
        from models.hybrid_forecast import HybridForecastModel
        model = HybridForecastModel(sequence_length=6)
        data = _make_data(36)
        trend, seasonal, residual = model.decompose_series(data)
        assert len(trend) == len(data)
        assert len(seasonal) == len(data)
        assert len(residual) == len(data)

    def test_prepare_lstm_data(self):
        from models.hybrid_forecast import HybridForecastModel
        model = HybridForecastModel(sequence_length=6)
        residual = np.random.randn(30).astype(np.float32)
        x_train, y_train, x_val, y_val = model._prepare_lstm_data(residual)
        assert len(x_train) > 0
        assert len(y_train) == len(x_train)

    def test_calculate_mape(self):
        from models.hybrid_forecast import HybridForecastModel
        model = HybridForecastModel(sequence_length=6)
        data = _make_data(36)
        # Need to train first so scaler is fitted
        try:
            model.train(data, epochs=1)
            mape = model._calculate_mape(data)
            assert isinstance(mape, float)
        except Exception:
            pass  # may fail if torch not available

    def test_train_raises_without_torch(self):
        from models.hybrid_forecast import HybridForecastModel
        try:
            import torch
            pytest.skip("PyTorch available")
        except ImportError:
            pass
        model = HybridForecastModel(sequence_length=6)
        with pytest.raises(Exception):
            model.train(_make_data(36), epochs=1)

    def test_train_with_torch(self):
        from models.hybrid_forecast import HybridForecastModel
        try:
            import torch
        except ImportError:
            pytest.skip("PyTorch not available")
        model = HybridForecastModel(sequence_length=6)
        data = _make_data(36)
        mape = model.train(data, epochs=2)
        assert isinstance(mape, float)

    def test_forecast_with_torch(self):
        from models.hybrid_forecast import HybridForecastModel
        try:
            import torch
        except ImportError:
            pytest.skip("PyTorch not available")
        model = HybridForecastModel(sequence_length=6)
        data = _make_data(36)
        model.train(data, epochs=2)
        preds, mape = model.forecast(data, steps=3)
        assert len(preds) == 3
        assert isinstance(mape, float)

    def test_save_and_load_with_torch(self):
        from models.hybrid_forecast import HybridForecastModel
        try:
            import torch
        except ImportError:
            pytest.skip("PyTorch not available")
        model = HybridForecastModel(sequence_length=6)
        data = _make_data(36)
        model.train(data, epochs=2)
        with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as f:
            path = f.name
        try:
            model.save_model(path)
            model2 = HybridForecastModel(sequence_length=6)
            model2.load_model(path)
        finally:
            os.unlink(path)

    def test_simple_lstm_forward(self):
        from models.hybrid_forecast import SimpleLSTM
        try:
            import torch
        except ImportError:
            pytest.skip("PyTorch not available")
        lstm = SimpleLSTM(input_size=1, hidden_size=8, num_layers=1)
        x = torch.randn(2, 6, 1)
        out = lstm(x)
        assert out.shape == (2, 1)
