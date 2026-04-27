#!/usr/bin/env python3
"""
Standalone training script for AI forecasting models.

This script:
1. Loads historical business metrics from the database
2. Trains PyTorch sales forecasting model
3. Trains TensorFlow cost forecasting model
4. Evaluates models and prints MAPE metrics
5. Saves trained model files to disk

Usage:
    python train_models.py
"""

import logging
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from database import DatabaseConnection
from models.hybrid_forecast import HybridForecastModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main training function"""
    logger.info("=" * 60)
    logger.info("Starting AI Model Training")
    logger.info("=" * 60)

    try:
        # Connect to database
        logger.info("Connecting to database...")
        db = DatabaseConnection(
            host="localhost",
            user="root",
            password=None,  # Will use MYSQL_PASSWORD env var
            database="businessai"
        )

        # Load historical data
        logger.info("Loading historical business metrics...")
        sales_data = db.get_business_metrics()
        cost_data = db.get_cost_metrics()

        if len(sales_data) < 24:
            logger.error(
                f"Insufficient data for training. "
                f"Need at least 24 months, got {len(sales_data)}"
            )
            return False

        logger.info(f"Loaded {len(sales_data)} months of sales data")
        logger.info(f"Loaded {len(cost_data)} months of cost data")

        # Create models directory if it doesn't exist
        models_dir = Path(__file__).parent / "trained_models"
        models_dir.mkdir(exist_ok=True)
        logger.info(f"Models will be saved to: {models_dir}")

        # Train sales forecasting model with hybrid approach
        logger.info("-" * 60)
        logger.info("Training Sales Forecasting Model (Hybrid: Trend + Seasonal + LSTM)")
        logger.info("-" * 60)
        sales_model = HybridForecastModel(sequence_length=12)
        
        sales_mape = sales_model.train(sales_data, epochs=100)

        logger.info(f"Sales Model Training Complete")
        logger.info(f"Sales Model Validation MAPE: {sales_mape:.4f}%")

        if sales_mape < 15:
            logger.info("✓ Sales model EXCELLENT (< 15% MAPE)")
        elif sales_mape < 20:
            logger.info("✓ Sales model meets MAPE requirement (< 20%)")
        else:
            logger.warning(
                f"⚠ Sales model MAPE {sales_mape:.4f}% exceeds "
                f"target of 20%"
            )

        # Save sales model
        sales_model_path = models_dir / "sales_forecast_model.pt"
        sales_model.save_model(str(sales_model_path))
        logger.info(f"Sales model saved to: {sales_model_path}")

        # Train cost forecasting model with hybrid approach
        logger.info("-" * 60)
        logger.info("Training Cost Forecasting Model (Hybrid: Trend + Seasonal + LSTM)...")
        logger.info("-" * 60)
        cost_model = HybridForecastModel(sequence_length=12)
        
        try:
            cost_mape = cost_model.train(cost_data, epochs=100)

            logger.info(f"Cost Model Training Complete")
            logger.info(f"Cost Model Validation MAPE: {cost_mape:.4f}%")

            if cost_mape < 15:
                logger.info("✓ Cost model EXCELLENT (< 15% MAPE)")
            elif cost_mape < 20:
                logger.info("✓ Cost model meets MAPE requirement (< 20%)")
            else:
                logger.warning(
                    f"⚠ Cost model MAPE {cost_mape:.4f}% exceeds "
                    f"target of 20%"
                )

            # Save cost model
            cost_model_path = models_dir / "cost_forecast_model.pt"
            cost_model.save_model(str(cost_model_path))
            logger.info(f"Cost model saved to: {cost_model_path}")
        except ImportError as e:
            logger.warning(f"⚠ Cost model training skipped: {e}")
            logger.warning("⚠ PyTorch is not available. Only sales forecasting will work.")
            cost_mape = None

        # Print summary
        logger.info("=" * 60)
        logger.info("Training Summary - Hybrid Forecasting Model")
        logger.info("=" * 60)
        logger.info(f"Sales Model MAPE: {sales_mape:.4f}%")
        if cost_mape is not None:
            logger.info(f"Cost Model MAPE: {cost_mape:.4f}%")
            avg_mape = (sales_mape + cost_mape) / 2
            logger.info(f"Average MAPE: {avg_mape:.4f}%")
        else:
            logger.info("Cost Model: Not trained")
        logger.info(f"Models saved to: {models_dir}")
        logger.info("=" * 60)
        logger.info("Hybrid Model Approach:")
        logger.info("  1. Trend Extraction - Linear regression for growth")
        logger.info("  2. Seasonal Decomposition - Monthly patterns")
        logger.info("  3. LSTM Residuals - Capture remaining patterns")
        logger.info("  Benefits:")
        logger.info("    • Explicit trend modeling")
        logger.info("    • Clear seasonal patterns")
        logger.info("    • Interpretable components")
        logger.info("    • Better generalization")
        logger.info("=" * 60)

        # Close database connection
        db.close()

        logger.info("✓ Training completed successfully!")
        return True

    except Exception as e:
        logger.error(f"Training failed with error: {e}", exc_info=True)
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
