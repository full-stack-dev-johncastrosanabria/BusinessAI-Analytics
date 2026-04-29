package com.businessai.analytics.service;

import com.businessai.analytics.entity.BusinessMetric;
import net.jqwik.api.*;
import net.jqwik.api.constraints.BigRange;
import net.jqwik.api.constraints.Positive;

import java.math.BigDecimal;

/**
 * Property 8: Business Metric Profit Calculation
 * 
 * For any business metric with total sales S, total costs C, and total expenses E,
 * the calculated profit SHALL equal S - C - E.
 * 
 * Validates: Requirements 4.2
 */
@Tag("business-ai-analytics")
public class BusinessMetricProfitCalculationProperties {

    @Property
    @Report(Reporting.GENERATED)
    void profitCalculationIsCorrect(
            @ForAll @Positive @BigRange(min = "0", max = "1000000") BigDecimal totalSales,
            @ForAll @Positive @BigRange(min = "0", max = "1000000") BigDecimal totalCosts,
            @ForAll @Positive @BigRange(min = "0", max = "1000000") BigDecimal totalExpenses) {

        // Calculate expected profit
        BigDecimal expectedProfit = totalSales.subtract(totalCosts).subtract(totalExpenses);

        // Create metric and verify profit calculation
        BusinessMetric metric = new BusinessMetric(1, 2024, totalSales, totalCosts, totalExpenses);
        
        assert metric.getProfit().compareTo(expectedProfit) == 0 : 
            String.format("Expected profit %s but got %s", expectedProfit, metric.getProfit());
    }

    @Property
    @Report(Reporting.GENERATED)
    void profitCanBeNegative(
            @ForAll @BigRange(min = "0", max = "100000") BigDecimal totalSales,
            @ForAll @BigRange(min = "100000", max = "1000000") BigDecimal totalCosts,
            @ForAll @BigRange(min = "0", max = "100000") BigDecimal totalExpenses) {

        // When costs exceed sales, profit should be negative
        BigDecimal expectedProfit = totalSales.subtract(totalCosts).subtract(totalExpenses);
        BusinessMetric metric = new BusinessMetric(1, 2024, totalSales, totalCosts, totalExpenses);
        
        assert metric.getProfit().compareTo(expectedProfit) == 0 : 
            String.format("Expected profit %s but got %s", expectedProfit, metric.getProfit());
    }

    @Property
    @Report(Reporting.GENERATED)
    void profitWithZeroValues(
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal totalSales) {

        // Test with zero costs and expenses
        BigDecimal expectedProfit = totalSales;
        BusinessMetric metric = new BusinessMetric(1, 2024, totalSales, BigDecimal.ZERO, BigDecimal.ZERO);
        
        assert metric.getProfit().compareTo(expectedProfit) == 0 : 
            String.format("Expected profit %s but got %s", expectedProfit, metric.getProfit());
    }

    @Property
    @Report(Reporting.GENERATED)
    void profitCalculationUsingStaticMethod(
            @ForAll @Positive @BigRange(min = "0", max = "1000000") BigDecimal totalSales,
            @ForAll @Positive @BigRange(min = "0", max = "1000000") BigDecimal totalCosts,
            @ForAll @Positive @BigRange(min = "0", max = "1000000") BigDecimal totalExpenses) {

        // Test the static profit calculation method
        BigDecimal expectedProfit = totalSales.subtract(totalCosts).subtract(totalExpenses);
        BigDecimal calculatedProfit = BusinessMetric.calculateProfit(totalSales, totalCosts, totalExpenses);
        
        assert calculatedProfit.compareTo(expectedProfit) == 0 : 
            String.format("Expected profit %s but got %s", expectedProfit, calculatedProfit);
    }
}
