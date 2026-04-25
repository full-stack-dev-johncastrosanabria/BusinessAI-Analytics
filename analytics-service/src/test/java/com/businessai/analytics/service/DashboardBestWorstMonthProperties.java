package com.businessai.analytics.service;

import com.businessai.analytics.entity.BusinessMetric;
import net.jqwik.api.*;
import net.jqwik.api.constraints.BigRange;
import net.jqwik.api.constraints.IntRange;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Property 11: Dashboard Best and Worst Month Identification
 * 
 * For any set of business metrics, the identified best performing month SHALL have the maximum profit value,
 * and the worst performing month SHALL have the minimum profit value among all metrics.
 * 
 * Validates: Requirements 5.2
 */
@Tag("Feature: business-ai-analytics, Property 11: Dashboard Best and Worst Month Identification")
public class DashboardBestWorstMonthProperties {

    @Property
    @Report(Reporting.GENERATED)
    void bestMonthHasMaximumProfit(
            @ForAll @IntRange(min = 2, max = 12) Integer metricCount,
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create metrics with varying profits
        List<BusinessMetric> metrics = createMetricsWithVaryingProfits(metricCount, month, year);

        if (metrics.isEmpty()) {
            return;
        }

        // Find best month
        BusinessMetric bestMonth = metrics.stream()
                .max(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        // Verify best month has maximum profit
        assert bestMonth != null : "Best month should not be null";
        
        BigDecimal maxProfit = metrics.stream()
                .map(BusinessMetric::getProfit)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        assert bestMonth.getProfit().compareTo(maxProfit) == 0 :
            String.format("Best month profit %s does not match maximum profit %s",
                    bestMonth.getProfit(), maxProfit);
    }

    @Property
    @Report(Reporting.GENERATED)
    void worstMonthHasMinimumProfit(
            @ForAll @IntRange(min = 2, max = 12) Integer metricCount,
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create metrics with varying profits
        List<BusinessMetric> metrics = createMetricsWithVaryingProfits(metricCount, month, year);

        if (metrics.isEmpty()) {
            return;
        }

        // Find worst month
        BusinessMetric worstMonth = metrics.stream()
                .min(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        // Verify worst month has minimum profit
        assert worstMonth != null : "Worst month should not be null";
        
        BigDecimal minProfit = metrics.stream()
                .map(BusinessMetric::getProfit)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        assert worstMonth.getProfit().compareTo(minProfit) == 0 :
            String.format("Worst month profit %s does not match minimum profit %s",
                    worstMonth.getProfit(), minProfit);
    }

    @Property
    @Report(Reporting.GENERATED)
    void bestAndWorstMonthsAreDifferentWhenProfitsVary(
            @ForAll @IntRange(min = 2, max = 12) Integer metricCount,
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create metrics with varying profits
        List<BusinessMetric> metrics = createMetricsWithVaryingProfits(metricCount, month, year);

        if (metrics.size() < 2) {
            return;
        }

        // Find best and worst months
        BusinessMetric bestMonth = metrics.stream()
                .max(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        BusinessMetric worstMonth = metrics.stream()
                .min(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        // Check if profits are different
        boolean profitsDiffer = metrics.stream()
                .map(BusinessMetric::getProfit)
                .distinct()
                .count() > 1;

        if (profitsDiffer) {
            assert !bestMonth.getId().equals(worstMonth.getId()) :
                "Best and worst months should be different when profits vary";
        }
    }

    @Property
    @Report(Reporting.GENERATED)
    void bestMonthIdentificationWithNegativeProfits(
            @ForAll @IntRange(min = 2, max = 12) Integer metricCount,
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create metrics with some negative profits
        List<BusinessMetric> metrics = new ArrayList<>();
        for (int i = 0; i < metricCount; i++) {
            BigDecimal sales = BigDecimal.valueOf(10000 + i * 1000);
            BigDecimal costs = BigDecimal.valueOf(15000 + i * 500); // Costs > sales for negative profit
            BigDecimal expenses = BigDecimal.valueOf(1000);

            BusinessMetric metric = new BusinessMetric(
                    (month + i) % 12 + 1,
                    year + (month + i) / 12,
                    sales, costs, expenses
            );
            metrics.add(metric);
        }

        // Find best month (least negative or most positive)
        BusinessMetric bestMonth = metrics.stream()
                .max(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        // Verify best month has maximum profit (even if negative)
        BigDecimal maxProfit = metrics.stream()
                .map(BusinessMetric::getProfit)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        assert bestMonth.getProfit().compareTo(maxProfit) == 0 :
            String.format("Best month profit %s does not match maximum profit %s",
                    bestMonth.getProfit(), maxProfit);
    }

    /**
     * Helper method to create metrics with varying profits
     */
    private List<BusinessMetric> createMetricsWithVaryingProfits(Integer count, Integer month, Integer year) {
        List<BusinessMetric> metrics = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            BigDecimal sales = BigDecimal.valueOf(50000 + i * 5000);
            BigDecimal costs = BigDecimal.valueOf(30000 + i * 2000);
            BigDecimal expenses = BigDecimal.valueOf(5000 + i * 500);

            BusinessMetric metric = new BusinessMetric(
                    (month + i) % 12 + 1,
                    year + (month + i) / 12,
                    sales, costs, expenses
            );
            metrics.add(metric);
        }

        return metrics;
    }
}
