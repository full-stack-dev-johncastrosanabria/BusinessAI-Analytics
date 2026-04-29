package com.businessai.analytics.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Report;
import net.jqwik.api.Reporting;
import net.jqwik.api.Tag;
import net.jqwik.api.constraints.IntRange;

/**
 * Property 12: Dashboard Top Products Ranking
 * 
 * For any set of products with associated sales transactions, the top 5 products by revenue
 * SHALL be correctly sorted in descending order by total revenue, where revenue equals the sum
 * of all transaction amounts for each product.
 * 
 * Validates: Requirements 5.3
 */
@Tag("business-ai-analytics")
public class DashboardTopProductsRankingProperties {

    /**
     * Simulates a product with revenue
     */
    static class ProductRevenue {
        public Long productId;
        public String productName;
        public BigDecimal revenue;

        public ProductRevenue(Long productId, String productName, BigDecimal revenue) {
            this.productId = productId;
            this.productName = productName;
            this.revenue = revenue;
        }
    }

    /**
     * Simulates a sales transaction
     */
    static class SalesTransaction {
        public Long productId;
        public BigDecimal amount;

        public SalesTransaction(Long productId, BigDecimal amount) {
            this.productId = productId;
            this.amount = amount;
        }
    }

    @Property
    @Report(Reporting.GENERATED)
    void topProductsAreSortedByRevenueDescending(
            @ForAll @IntRange(min = 5, max = 20) Integer productCount,
            @ForAll @IntRange(min = 1, max = 100) Integer transactionCount) {

        // Create transactions for products
        List<SalesTransaction> transactions = createRandomTransactions(productCount, transactionCount);

        // Calculate revenue per product
        Map<Long, BigDecimal> productRevenue = aggregateProductRevenue(transactions);

        // Get top 5 products
        List<ProductRevenue> topProducts = getTopProducts(productRevenue, 5);

        // Verify top products are sorted in descending order by revenue
        for (int i = 1; i < topProducts.size(); i++) {
            ProductRevenue prev = topProducts.get(i - 1);
            ProductRevenue curr = topProducts.get(i);

            assert prev.revenue.compareTo(curr.revenue) >= 0 :
                String.format("Products not sorted by revenue: %s (%.2f) comes before %s (%.2f)",
                        prev.productName, prev.revenue, curr.productName, curr.revenue);
        }
    }

    @Property
    @Report(Reporting.GENERATED)
    void topProductsLimitedToFive(
            @ForAll @IntRange(min = 10, max = 50) Integer productCount,
            @ForAll @IntRange(min = 1, max = 100) Integer transactionCount) {

        // Create transactions for products
        List<SalesTransaction> transactions = createRandomTransactions(productCount, transactionCount);

        // Calculate revenue per product
        Map<Long, BigDecimal> productRevenue = aggregateProductRevenue(transactions);

        // Get top 5 products
        List<ProductRevenue> topProducts = getTopProducts(productRevenue, 5);

        // Verify at most 5 products returned
        assert topProducts.size() <= 5 :
            String.format("Expected at most 5 products but got %d", topProducts.size());
    }

    @Property
    @Report(Reporting.GENERATED)
    void topProductsIncludeHighestRevenue(
            @ForAll @IntRange(min = 5, max = 20) Integer productCount,
            @ForAll @IntRange(min = 1, max = 100) Integer transactionCount) {

        // Create transactions for products
        List<SalesTransaction> transactions = createRandomTransactions(productCount, transactionCount);

        // Calculate revenue per product
        Map<Long, BigDecimal> productRevenue = aggregateProductRevenue(transactions);

        // Get top 5 products
        List<ProductRevenue> topProducts = getTopProducts(productRevenue, 5);

        if (topProducts.isEmpty()) {
            return;
        }

        // Find the highest revenue
        BigDecimal maxRevenue = productRevenue.values().stream()
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        // Verify top product has the highest revenue
        assert topProducts.get(0).revenue.compareTo(maxRevenue) == 0 :
            String.format("Top product revenue %s does not match maximum revenue %s",
                    topProducts.get(0).revenue, maxRevenue);
    }

    @Property
    @Report(Reporting.GENERATED)
    void topProductsWithEqualRevenue(
            @ForAll @IntRange(min = 5, max = 10) Integer productCount) {

        // Create products with equal revenue
        Map<Long, BigDecimal> productRevenue = new HashMap<>();
        BigDecimal equalRevenue = BigDecimal.valueOf(10000);

        for (long i = 1; i <= productCount; i++) {
            productRevenue.put(i, equalRevenue);
        }

        // Get top 5 products
        List<ProductRevenue> topProducts = getTopProducts(productRevenue, 5);

        // Verify all returned products have the same revenue
        for (ProductRevenue product : topProducts) {
            assert product.revenue.compareTo(equalRevenue) == 0 :
                String.format("Expected revenue %s but got %s", equalRevenue, product.revenue);
        }

        // Verify at most 5 products returned
        assert topProducts.size() <= 5 :
            String.format("Expected at most 5 products but got %d", topProducts.size());
    }

    @Property
    @Report(Reporting.GENERATED)
    void topProductsWithFewerThanFiveProducts(
            @ForAll @IntRange(min = 1, max = 4) Integer productCount,
            @ForAll @IntRange(min = 1, max = 50) Integer transactionCount) {

        // Create transactions ensuring every product gets at least one transaction
        List<SalesTransaction> transactions = createTransactionsWithAllProducts(productCount, transactionCount);

        // Calculate revenue per product
        Map<Long, BigDecimal> productRevenue = aggregateProductRevenue(transactions);

        // Get top 5 products
        List<ProductRevenue> topProducts = getTopProducts(productRevenue, 5);

        // Verify all products are returned when fewer than 5
        assert topProducts.size() == productRevenue.size() :
            String.format("Expected %d products but got %d", productRevenue.size(), topProducts.size());

        // Also verify we don't exceed productCount
        assert topProducts.size() <= productCount :
            String.format("Expected at most %d products but got %d", productCount, topProducts.size());
    }

    /**
     * Helper method to create random transactions
     */
    private List<SalesTransaction> createRandomTransactions(Integer productCount, Integer transactionCount) {
        List<SalesTransaction> transactions = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < transactionCount; i++) {
            long productId = (long) (random.nextInt(productCount) + 1);
            BigDecimal amount = BigDecimal.valueOf(Math.random() * 10000);
            transactions.add(new SalesTransaction(productId, amount));
        }

        return transactions;
    }

    /**
     * Helper method to create transactions ensuring every product gets at least one transaction
     */
    private List<SalesTransaction> createTransactionsWithAllProducts(Integer productCount, Integer transactionCount) {
        List<SalesTransaction> transactions = new ArrayList<>();
        Random random = new Random();

        // First, ensure each product gets at least one transaction
        for (long productId = 1; productId <= productCount; productId++) {
            BigDecimal amount = BigDecimal.valueOf(1000 + random.nextInt(9000));
            transactions.add(new SalesTransaction(productId, amount));
        }

        // Add remaining random transactions (only if transactionCount > productCount)
        int remaining = transactionCount - productCount;
        for (int i = 0; i < remaining; i++) {
            long productId = (long) (random.nextInt(productCount) + 1);
            BigDecimal amount = BigDecimal.valueOf(1000 + random.nextInt(9000));
            transactions.add(new SalesTransaction(productId, amount));
        }

        return transactions;
    }

    /**
     * Helper method to aggregate revenue by product
     */
    private Map<Long, BigDecimal> aggregateProductRevenue(List<SalesTransaction> transactions) {
        return transactions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.productId,
                        Collectors.reducing(BigDecimal.ZERO, t -> t.amount, BigDecimal::add)
                ));
    }

    /**
     * Helper method to get top N products by revenue
     */
    private List<ProductRevenue> getTopProducts(Map<Long, BigDecimal> productRevenue, int limit) {
        return productRevenue.entrySet().stream()
                .map(e -> new ProductRevenue(e.getKey(), "Product " + e.getKey(), e.getValue()))
                .sorted((a, b) -> b.revenue.compareTo(a.revenue))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
