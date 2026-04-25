"""
Property-based tests for profit forecast calculation
Tests that profit[month] = sales[month] - cost[month] for all months
"""

import pytest
import numpy as np


class TestProfitForecastCalculation:
    """Test profit forecast calculation property"""
    
    def test_profit_equals_sales_minus_cost_basic(self):
        """
        Property 16: Profit Forecast Calculation
        Test that profit[month] = sales[month] - cost[month] for all months
        
        Validates: Requirements 10.1
        """
        sales_predictions = [10000.0, 11000.0, 12000.0, 13000.0, 14000.0, 15000.0,
                            16000.0, 17000.0, 18000.0, 19000.0, 20000.0, 21000.0]
        cost_predictions = [5000.0, 5500.0, 6000.0, 6500.0, 7000.0, 7500.0,
                           8000.0, 8500.0, 9000.0, 9500.0, 10000.0, 10500.0]
        
        sales_array = np.array(sales_predictions)
        cost_array = np.array(cost_predictions)
        
        # Calculate profit
        profit_array = sales_array - cost_array
        
        # Verify each month
        for month in range(12):
            expected_profit = sales_array[month] - cost_array[month]
            actual_profit = profit_array[month]
            
            assert abs(expected_profit - actual_profit) < 0.01, \
                f"Month {month}: profit {actual_profit} != sales {sales_array[month]} - cost {cost_array[month]}"
    
    def test_profit_equals_sales_minus_cost_varied(self):
        """Test profit calculation with varied values"""
        sales_predictions = [5000.0, 7500.0, 10000.0, 12500.0, 15000.0, 17500.0,
                            20000.0, 22500.0, 25000.0, 27500.0, 30000.0, 32500.0]
        cost_predictions = [2000.0, 3000.0, 4000.0, 5000.0, 6000.0, 7000.0,
                           8000.0, 9000.0, 10000.0, 11000.0, 12000.0, 13000.0]
        
        sales_array = np.array(sales_predictions)
        cost_array = np.array(cost_predictions)
        profit_array = sales_array - cost_array
        
        for month in range(12):
            expected_profit = sales_array[month] - cost_array[month]
            actual_profit = profit_array[month]
            assert abs(expected_profit - actual_profit) < 0.01
    
    def test_profit_calculation_with_zero_costs(self):
        """Test profit calculation when costs are zero"""
        sales = np.array([10000.0] * 12)
        costs = np.array([0.0] * 12)
        
        profit = sales - costs
        
        # Profit should equal sales when costs are zero
        np.testing.assert_array_almost_equal(profit, sales)
    
    def test_profit_calculation_with_equal_sales_and_costs(self):
        """Test profit calculation when sales equal costs"""
        sales = np.array([5000.0] * 12)
        costs = np.array([5000.0] * 12)
        
        profit = sales - costs
        
        # Profit should be zero when sales equal costs
        np.testing.assert_array_almost_equal(profit, np.zeros(12))
    
    def test_profit_calculation_with_negative_profit(self):
        """Test profit calculation when costs exceed sales"""
        sales = np.array([3000.0] * 12)
        costs = np.array([5000.0] * 12)
        
        profit = sales - costs
        
        # Profit should be negative when costs exceed sales
        expected = np.array([-2000.0] * 12)
        np.testing.assert_array_almost_equal(profit, expected)
    
    def test_profit_calculation_preserves_precision(self):
        """Test that profit calculation preserves numerical precision"""
        sales = np.array([10000.123, 20000.456, 30000.789] + [5000.0] * 9)
        costs = np.array([5000.111, 10000.222, 15000.333] + [2500.0] * 9)
        
        profit = sales - costs
        
        # Check first three months with high precision
        assert abs(profit[0] - (10000.123 - 5000.111)) < 0.001
        assert abs(profit[1] - (20000.456 - 10000.222)) < 0.001
        assert abs(profit[2] - (30000.789 - 15000.333)) < 0.001
    
    def test_profit_calculation_with_large_numbers(self):
        """Test profit calculation with large numbers"""
        sales = np.array([1e7] * 12)  # 10 million
        costs = np.array([5e6] * 12)  # 5 million
        
        profit = sales - costs
        
        expected = np.array([5e6] * 12)  # 5 million profit
        np.testing.assert_array_almost_equal(profit, expected, decimal=0)
    
    def test_profit_calculation_with_small_numbers(self):
        """Test profit calculation with small numbers"""
        sales = np.array([100.0] * 12)
        costs = np.array([50.0] * 12)
        
        profit = sales - costs
        
        expected = np.array([50.0] * 12)
        np.testing.assert_array_almost_equal(profit, expected)
