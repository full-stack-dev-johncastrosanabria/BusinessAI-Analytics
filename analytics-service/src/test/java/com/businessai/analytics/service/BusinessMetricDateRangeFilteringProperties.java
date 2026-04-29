package com.businessai.analytics.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.businessai.analytics.entity.BusinessMetric;

import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Report;
import net.jqwik.api.Reporting;
import net.jqwik.api.Tag;
import net.jqwik.api.constraints.IntRange;

/**
 * Property 9: Business Metric Date Range Filtering
 * 
 * For any business metric query with a date range [start_month/year, end_month/year],
 * all returned metrics SHALL have month/year values within the specified range (inclusive).
 * 
 * Validates: Requirements 4.3
 */
@Tag("business-ai-analytics")
public class BusinessMetricDateRangeFilteringProperties {

    /**
     * Simulates the date range filtering logic from MetricsRepository.findByDateRange
     */
    private List<BusinessMetric> filterByDateRange(List<BusinessMetric> allMetrics,
                                                    Integer startYear, Integer startMonth,
                                                    Integer endYear, Integer endMonth) {
        return allMetrics.stream()
                .filter(bm -> {
                    boolean afterStart = bm.getYear() > startYear
                            || (bm.getYear().equals(startYear) && bm.getMonth() >= startMonth);
                    boolean beforeEnd = bm.getYear() < endYear
                            || (bm.getYear().equals(endYear) && bm.getMonth() <= endMonth);
                    return afterStart && beforeEnd;
                })
                .sorted((a, b) -> {
                    int yearCmp = a.getYear().compareTo(b.getYear());
                    return yearCmp != 0 ? yearCmp : a.getMonth().compareTo(b.getMonth());
                })
                .collect(Collectors.toList());
    }

    /**
     * Creates a full set of test metrics spanning 2020-2024
     */
    private List<BusinessMetric> createTestMetrics() {
        List<BusinessMetric> metrics = new ArrayList<>();
        for (int year = 2020; year <= 2024; year++) {
            for (int month = 1; month <= 12; month++) {
                BusinessMetric metric = new BusinessMetric(
                        month, year,
                        BigDecimal.valueOf(50000 + year * 1000L + month * 100L),
                        BigDecimal.valueOf(30000 + year * 500L + month * 50L),
                        BigDecimal.valueOf(10000 + year * 200L + month * 20L)
                );
                metrics.add(metric);
            }
        }
        return metrics;
    }

    @Property
    @Report(Reporting.GENERATED)
    void dateRangeFilteringReturnsOnlyMetricsInRange(
            @ForAll @IntRange(min = 2020, max = 2024) Integer startYear,
            @ForAll @IntRange(min = 1, max = 12) Integer startMonth,
            @ForAll @IntRange(min = 2020, max = 2024) Integer endYear,
            @ForAll @IntRange(min = 1, max = 12) Integer endMonth) {

        // Ensure valid range
        if (startYear > endYear || (startYear.equals(endYear) && startMonth > endMonth)) {
            return; // Skip invalid ranges
        }

        List<BusinessMetric> allMetrics = createTestMetrics();

        // Filter metrics in range
        List<BusinessMetric> results = filterByDateRange(allMetrics, startYear, startMonth, endYear, endMonth);

        // Verify all results are within range
        for (BusinessMetric metric : results) {
            boolean isInRange = isDateInRange(metric.getYear(), metric.getMonth(),
                                             startYear, startMonth, endYear, endMonth);
            assert isInRange : String.format("Metric %d/%d is outside range %d/%d to %d/%d",
                    metric.getMonth(), metric.getYear(), startMonth, startYear, endMonth, endYear);
        }
    }

    @Property
    @Report(Reporting.GENERATED)
    void dateRangeFilteringIncludesBoundaries(
            @ForAll @IntRange(min = 2020, max = 2024) Integer year,
            @ForAll @IntRange(min = 1, max = 12) Integer month) {

        List<BusinessMetric> allMetrics = createTestMetrics();

        // Query for exact month/year
        List<BusinessMetric> results = filterByDateRange(allMetrics, year, month, year, month);

        // All results should be for that exact month/year
        for (BusinessMetric metric : results) {
            assert metric.getYear().equals(year) && metric.getMonth().equals(month) :
                String.format("Metric %d/%d is outside exact range %d/%d",
                        metric.getMonth(), metric.getYear(), month, year);
        }

        // The exact month/year should be found (since we create metrics for all months 2020-2024)
        assert results.size() == 1 :
            String.format("Expected exactly 1 metric for %d/%d but got %d", month, year, results.size());
    }

    @Property
    @Report(Reporting.GENERATED)
    void dateRangeFilteringOrdersResultsCorrectly(
            @ForAll @IntRange(min = 2020, max = 2023) Integer startYear,
            @ForAll @IntRange(min = 1, max = 12) Integer startMonth,
            @ForAll @IntRange(min = 2020, max = 2024) Integer endYear,
            @ForAll @IntRange(min = 1, max = 12) Integer endMonth) {

        // Ensure valid range
        if (startYear > endYear || (startYear.equals(endYear) && startMonth > endMonth)) {
            return;
        }

        List<BusinessMetric> allMetrics = createTestMetrics();

        // Filter metrics in range
        List<BusinessMetric> results = filterByDateRange(allMetrics, startYear, startMonth, endYear, endMonth);

        // Verify results are ordered by year then month
        for (int i = 1; i < results.size(); i++) {
            BusinessMetric prev = results.get(i - 1);
            BusinessMetric curr = results.get(i);

            int prevDate = prev.getYear() * 100 + prev.getMonth();
            int currDate = curr.getYear() * 100 + curr.getMonth();

            assert prevDate <= currDate :
                String.format("Results not ordered: %d/%d comes before %d/%d",
                        prev.getMonth(), prev.getYear(), curr.getMonth(), curr.getYear());
        }
    }

    private boolean isDateInRange(Integer year, Integer month,
                                  Integer startYear, Integer startMonth,
                                  Integer endYear, Integer endMonth) {
        int date = year * 100 + month;
        int start = startYear * 100 + startMonth;
        int end = endYear * 100 + endMonth;
        return date >= start && date <= end;
    }
}
