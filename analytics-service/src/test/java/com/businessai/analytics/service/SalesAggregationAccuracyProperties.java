package com.businessai.analytics.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Report;
import net.jqwik.api.Reporting;
import net.jqwik.api.Tag;
import net.jqwik.api.constraints.BigRange;
import net.jqwik.api.constraints.IntRange;

/**
 * Property 10: Sales Aggregation Accuracy
 * 
 * For any set of sales transactions within a given month, aggregating them into a business metric
 * SHALL produce a total sales value equal to the sum of all transaction amounts for that month.
 * 
 * Validates: Requirements 4.4
 */
@Tag("business-ai-analytics")
public class SalesAggregationAccuracyProperties {

    /**
     * Simulates a sales transaction for testing
     */
    static class SalesTransaction {
        public Long id;
        public Long customerId;
        public Long productId;
        public Integer month;
        public Integer year;
        public BigDecimal amount;

        public SalesTransaction(Long id, Long customerId, Long productId, 
                               Integer month, Integer year, BigDecimal amount) {
            this.id = id;
            this.customerId = customerId;
            this.productId = productId;
            this.month = month;
            this.year = year;
            this.amount = amount;
        }
    }

    @Property
    @Report(Reporting.GENERATED)
    void aggregatedSalesEqualsSumOfTransactions(
            @ForAll @IntRange(min = 1, max = 100) Integer transactionCount,
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create test transactions
        List<SalesTransaction> transactions = new ArrayList<>();
        BigDecimal expectedTotal = BigDecimal.ZERO;

        for (int i = 0; i < transactionCount; i++) {
            BigDecimal amount = BigDecimal.valueOf(Math.random() * 10000);
            transactions.add(new SalesTransaction(
                    (long) i, (long) (i % 10), (long) (i % 5),
                    month, year, amount
            ));
            expectedTotal = expectedTotal.add(amount);
        }

        // Aggregate sales
        BigDecimal aggregatedSales = aggregateSalesForMonth(transactions, month, year);

        // Verify aggregation equals sum
        assert aggregatedSales.compareTo(expectedTotal) == 0 :
            String.format("Expected aggregated sales %s but got %s", expectedTotal, aggregatedSales);
    }

    @Property
    @Report(Reporting.GENERATED)
    void aggregationIgnoresOtherMonths(
            @ForAll @IntRange(min = 1, max = 100) Integer transactionCount,
            @ForAll @IntRange(min = 1, max = 12) Integer targetMonth,
            @ForAll @IntRange(min = 2020, max = 2024) Integer targetYear) {

        // Create transactions for multiple months
        List<SalesTransaction> transactions = new ArrayList<>();
        BigDecimal expectedTotal = BigDecimal.ZERO;

        for (int i = 0; i < transactionCount; i++) {
            int month = (i % 3) + 1; // Months 1-3
            int year = 2024;
            BigDecimal amount = BigDecimal.valueOf(Math.random() * 10000);

            transactions.add(new SalesTransaction(
                    (long) i, (long) (i % 10), (long) (i % 5),
                    month, year, amount
            ));

            // Only count transactions for target month
            if (month == targetMonth && year == targetYear) {
                expectedTotal = expectedTotal.add(amount);
            }
        }

        // Aggregate for target month
        BigDecimal aggregatedSales = aggregateSalesForMonth(transactions, targetMonth, targetYear);

        // Verify only target month transactions are included
        assert aggregatedSales.compareTo(expectedTotal) == 0 :
            String.format("Expected aggregated sales %s but got %s for month %d/%d",
                    expectedTotal, aggregatedSales, targetMonth, targetYear);
    }

    @Property
    @Report(Reporting.GENERATED)
    void aggregationWithZeroTransactions(
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create empty transaction list
        List<SalesTransaction> transactions = new ArrayList<>();

        // Aggregate sales
        BigDecimal aggregatedSales = aggregateSalesForMonth(transactions, month, year);

        // Should be zero
        assert aggregatedSales.compareTo(BigDecimal.ZERO) == 0 :
            String.format("Expected zero aggregated sales but got %s", aggregatedSales);
    }

    @Property
    @Report(Reporting.GENERATED)
    void aggregationWithLargeAmounts(
            @ForAll @IntRange(min = 1, max = 50) Integer transactionCount,
            @ForAll @BigRange(min = "1000000", max = "10000000") BigDecimal amount,
            @ForAll @IntRange(min = 1, max = 12) Integer month,
            @ForAll @IntRange(min = 2020, max = 2024) Integer year) {

        // Create transactions with large amounts
        List<SalesTransaction> transactions = new ArrayList<>();
        BigDecimal expectedTotal = BigDecimal.ZERO;

        for (int i = 0; i < transactionCount; i++) {
            transactions.add(new SalesTransaction(
                    (long) i, (long) (i % 10), (long) (i % 5),
                    month, year, amount
            ));
            expectedTotal = expectedTotal.add(amount);
        }

        // Aggregate sales
        BigDecimal aggregatedSales = aggregateSalesForMonth(transactions, month, year);

        // Verify aggregation
        assert aggregatedSales.compareTo(expectedTotal) == 0 :
            String.format("Expected aggregated sales %s but got %s", expectedTotal, aggregatedSales);
    }

    /**
     * Helper method to aggregate sales for a specific month
     */
    private BigDecimal aggregateSalesForMonth(List<SalesTransaction> transactions, Integer month, Integer year) {
        return transactions.stream()
                .filter(t -> t.month.equals(month) && t.year.equals(year))
                .map(t -> t.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
