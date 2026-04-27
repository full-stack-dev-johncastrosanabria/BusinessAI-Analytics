package com.businessai.analytics.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.businessai.analytics.entity.BusinessMetric;
import com.businessai.analytics.repository.MetricsRepository;

@Service
@Transactional
public class AnalyticsService {

    // Constants to avoid magic numbers
    private static final int MIN_MONTH = 1;
    private static final int MAX_MONTH = 12;
    private static final int MIN_YEAR = 1900;
    private static final int MAX_YEAR = 2100;

    private final MetricsRepository metricsRepository;

    public AnalyticsService(MetricsRepository metricsRepository) {
        this.metricsRepository = metricsRepository;
    }

    /**
     * Create a new business metric
     */
    public BusinessMetric createMetric(Integer month, Integer year, BigDecimal totalSales,
                                       BigDecimal totalCosts, BigDecimal totalExpenses) {
        // Validate inputs
        if (month == null || month < MIN_MONTH || month > MAX_MONTH) {
            throw new IllegalArgumentException("Month must be between " + MIN_MONTH + " and " + MAX_MONTH);
        }
        if (year == null || year < MIN_YEAR || year > MAX_YEAR) {
            throw new IllegalArgumentException("Year must be between " + MIN_YEAR + " and " + MAX_YEAR);
        }
        if (totalSales == null || totalSales.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total sales must be non-negative");
        }
        if (totalCosts == null || totalCosts.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total costs must be non-negative");
        }
        if (totalExpenses == null || totalExpenses.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total expenses must be non-negative");
        }

        // Check for duplicate month/year
        if (metricsRepository.findByMonthAndYear(month, year).isPresent()) {
            throw new IllegalArgumentException("Metric already exists for month " + month + " and year " + year);
        }

        // Calculate profit
        BigDecimal profit = calculateProfit(totalSales, totalCosts, totalExpenses);

        // Create and save metric
        BusinessMetric metric = new BusinessMetric(month, year, totalSales, totalCosts, totalExpenses);
        metric.setProfit(profit);
        return metricsRepository.save(metric);
    }

    /**
     * Calculate profit: profit = totalSales - totalCosts - totalExpenses
     */
    public BigDecimal calculateProfit(BigDecimal totalSales, BigDecimal totalCosts, BigDecimal totalExpenses) {
        if (totalSales == null || totalCosts == null || totalExpenses == null) {
            throw new IllegalArgumentException("All parameters must be non-null");
        }
        return totalSales.subtract(totalCosts).subtract(totalExpenses);
    }

    /**
     * Get a metric by ID
     */
    public BusinessMetric getMetricById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID must not be null");
        }
        return metricsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Metric not found with id: " + id));
    }

    /**
     * Get all metrics
     */
    public List<BusinessMetric> getAllMetrics() {
        return metricsRepository.findAllByOrderByYearAscMonthAsc();
    }

    /**
     * Get metrics within a date range
     */
    public List<BusinessMetric> getMetricsByDateRange(Integer startYear, Integer startMonth,
                                                      Integer endYear, Integer endMonth) {
        // Validate inputs
        if (startYear == null || startMonth == null || endYear == null || endMonth == null) {
            throw new IllegalArgumentException("All date range parameters are required");
        }
        
        // Validate month ranges
        if (startMonth < MIN_MONTH || startMonth > MAX_MONTH || endMonth < MIN_MONTH || endMonth > MAX_MONTH) {
            throw new IllegalArgumentException("Months must be between " + MIN_MONTH + " and " + MAX_MONTH);
        }
        
        // Validate date order
        if (startYear > endYear || (startYear.equals(endYear) && startMonth > endMonth)) {
            throw new IllegalArgumentException("Start date must be before or equal to end date");
        }

        return metricsRepository.findByDateRange(startYear, startMonth, endYear, endMonth);
    }

    /**
     * Update a metric
     */
    public BusinessMetric updateMetric(Long id, BigDecimal totalSales, BigDecimal totalCosts, BigDecimal totalExpenses) {
        if (id == null) {
            throw new IllegalArgumentException("ID must not be null");
        }
        BusinessMetric metric = getMetricById(id);

        if (totalSales != null && totalSales.compareTo(BigDecimal.ZERO) >= 0) {
            metric.setTotalSales(totalSales);
        }
        if (totalCosts != null && totalCosts.compareTo(BigDecimal.ZERO) >= 0) {
            metric.setTotalCosts(totalCosts);
        }
        if (totalExpenses != null && totalExpenses.compareTo(BigDecimal.ZERO) >= 0) {
            metric.setTotalExpenses(totalExpenses);
        }

        // Recalculate profit
        BigDecimal profit = calculateProfit(metric.getTotalSales(), metric.getTotalCosts(), metric.getTotalExpenses());
        metric.setProfit(profit);

        return metricsRepository.save(metric);
    }

    /**
     * Delete a metric
     */
    public void deleteMetric(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID must not be null");
        }
        if (!metricsRepository.existsById(id)) {
            throw new IllegalArgumentException("Metric not found with id: " + id);
        }
        metricsRepository.deleteById(id);
    }

    /**
     * Get dashboard summary with best/worst months and top products
     * Note: This is a simplified version that works with available metrics
     */
    public DashboardSummary getDashboardSummary(Integer startYear, Integer startMonth,
                                                Integer endYear, Integer endMonth) {
        if (startYear == null || startMonth == null || endYear == null || endMonth == null) {
            throw new IllegalArgumentException("All date range parameters are required");
        }
        List<BusinessMetric> metrics = getMetricsByDateRange(startYear, startMonth, endYear, endMonth);

        if (metrics.isEmpty()) {
            return new DashboardSummary(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, null, new ArrayList<>());
        }

        // Calculate totals
        BigDecimal totalSales = metrics.stream()
                .map(BusinessMetric::getTotalSales)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCosts = metrics.stream()
                .map(BusinessMetric::getTotalCosts)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfit = metrics.stream()
                .map(BusinessMetric::getProfit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Find best and worst months
        BusinessMetric bestMonth = metrics.stream()
                .max(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        BusinessMetric worstMonth = metrics.stream()
                .min(Comparator.comparing(BusinessMetric::getProfit))
                .orElse(null);

        return new DashboardSummary(totalSales, totalCosts, totalProfit, bestMonth, worstMonth, new ArrayList<>());
    }

    /**
     * Dashboard summary DTO
     */
    public static class DashboardSummary {
        public BigDecimal totalSales;
        public BigDecimal totalCosts;
        public BigDecimal totalProfit;
        public BusinessMetric bestMonth;
        public BusinessMetric worstMonth;
        public List<TopProduct> topProducts;

        public DashboardSummary(BigDecimal totalSales, BigDecimal totalCosts, BigDecimal totalProfit,
                               BusinessMetric bestMonth, BusinessMetric worstMonth, List<TopProduct> topProducts) {
            this.totalSales = totalSales;
            this.totalCosts = totalCosts;
            this.totalProfit = totalProfit;
            this.bestMonth = bestMonth;
            this.worstMonth = worstMonth;
            this.topProducts = topProducts;
        }

        public BigDecimal getTotalSales() {
            return totalSales;
        }

        public BigDecimal getTotalCosts() {
            return totalCosts;
        }

        public BigDecimal getTotalProfit() {
            return totalProfit;
        }

        public BusinessMetric getBestMonth() {
            return bestMonth;
        }

        public BusinessMetric getWorstMonth() {
            return worstMonth;
        }

        public List<TopProduct> getTopProducts() {
            return topProducts;
        }
    }

    /**
     * Top product DTO
     */
    public static class TopProduct {
        public Long productId;
        public String productName;
        public BigDecimal revenue;

        public TopProduct(Long productId, String productName, BigDecimal revenue) {
            this.productId = productId;
            this.productName = productName;
            this.revenue = revenue;
        }

        public Long getProductId() {
            return productId;
        }

        public String getProductName() {
            return productName;
        }

        public BigDecimal getRevenue() {
            return revenue;
        }
    }
}
