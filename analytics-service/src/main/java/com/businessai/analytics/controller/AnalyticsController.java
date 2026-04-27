package com.businessai.analytics.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.businessai.analytics.entity.BusinessMetric;
import com.businessai.analytics.service.AnalyticsService;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    // Constants for repeated strings
    private static final String VALIDATION_FAILED = VALIDATION_FAILED;
    private static final String NOT_FOUND = NOT_FOUND;

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Create a new business metric
     * POST /api/analytics/metrics
     */
    @PostMapping("/metrics")
    public ResponseEntity<?> createMetric(@RequestBody CreateMetricRequest request) {
        try {
            BusinessMetric metric = analyticsService.createMetric(
                    request.getMonth(),
                    request.getYear(),
                    request.getTotalSales(),
                    request.getTotalCosts(),
                    request.getTotalExpenses()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(metric);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(VALIDATION_FAILED, e.getMessage()));
        }
    }

    /**
     * Get all metrics or filter by date range
     * GET /api/analytics/metrics?startYear=2024&startMonth=1&endYear=2024&endMonth=12
     */
    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer startMonth,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Integer endMonth) {
        try {
            List<BusinessMetric> metrics;
            if (startYear != null && startMonth != null && endYear != null && endMonth != null) {
                metrics = analyticsService.getMetricsByDateRange(startYear, startMonth, endYear, endMonth);
            } else {
                metrics = analyticsService.getAllMetrics();
            }
            return ResponseEntity.ok(metrics);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(VALIDATION_FAILED, e.getMessage()));
        }
    }

    /**
     * Get a specific metric by ID
     * GET /api/analytics/metrics/{id}
     */
    @GetMapping("/metrics/{id}")
    public ResponseEntity<?> getMetricById(@PathVariable Long id) {
        try {
            BusinessMetric metric = analyticsService.getMetricById(id);
            return ResponseEntity.ok(metric);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(NOT_FOUND, e.getMessage()));
        }
    }

    /**
     * Update a metric
     * PUT /api/analytics/metrics/{id}
     */
    @PutMapping("/metrics/{id}")
    public ResponseEntity<?> updateMetric(@PathVariable Long id, @RequestBody UpdateMetricRequest request) {
        try {
            BusinessMetric metric = analyticsService.updateMetric(
                    id,
                    request.getTotalSales(),
                    request.getTotalCosts(),
                    request.getTotalExpenses()
            );
            return ResponseEntity.ok(metric);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(NOT_FOUND, e.getMessage()));
        }
    }

    /**
     * Delete a metric
     * DELETE /api/analytics/metrics/{id}
     */
    @DeleteMapping("/metrics/{id}")
    public ResponseEntity<?> deleteMetric(@PathVariable Long id) {
        try {
            analyticsService.deleteMetric(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(NOT_FOUND, e.getMessage()));
        }
    }

    /**
     * Get dashboard summary
     * GET /api/analytics/dashboard?startYear=2024&startMonth=1&endYear=2024&endMonth=12
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestParam(required = false) Integer startYear,
            @RequestParam(required = false) Integer startMonth,
            @RequestParam(required = false) Integer endYear,
            @RequestParam(required = false) Integer endMonth) {
        try {
            // Default to current year if not specified
            if (startYear == null) {
                startYear = 2024;
                startMonth = 1;
                endYear = 2024;
                endMonth = 12;
            }

            AnalyticsService.DashboardSummary summary = analyticsService.getDashboardSummary(
                    startYear, startMonth, endYear, endMonth
            );
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(VALIDATION_FAILED, e.getMessage()));
        }
    }

    /**
     * Trigger sales data aggregation (placeholder for future implementation)
     * POST /api/analytics/aggregate
     */
    @PostMapping("/aggregate")
    public ResponseEntity<?> aggregateSalesData() {
        return ResponseEntity.ok(new AggregationResponse("Aggregation triggered successfully"));
    }

    // Request/Response DTOs
    public static class CreateMetricRequest {
        private Integer month;
        private Integer year;
        private BigDecimal totalSales;
        private BigDecimal totalCosts;
        private BigDecimal totalExpenses;

        public Integer getMonth() {
            return month;
        }

        public void setMonth(Integer month) {
            this.month = month;
        }

        public Integer getYear() {
            return year;
        }

        public void setYear(Integer year) {
            this.year = year;
        }

        public BigDecimal getTotalSales() {
            return totalSales;
        }

        public void setTotalSales(BigDecimal totalSales) {
            this.totalSales = totalSales;
        }

        public BigDecimal getTotalCosts() {
            return totalCosts;
        }

        public void setTotalCosts(BigDecimal totalCosts) {
            this.totalCosts = totalCosts;
        }

        public BigDecimal getTotalExpenses() {
            return totalExpenses;
        }

        public void setTotalExpenses(BigDecimal totalExpenses) {
            this.totalExpenses = totalExpenses;
        }
    }

    public static class UpdateMetricRequest {
        private BigDecimal totalSales;
        private BigDecimal totalCosts;
        private BigDecimal totalExpenses;

        public BigDecimal getTotalSales() {
            return totalSales;
        }

        public void setTotalSales(BigDecimal totalSales) {
            this.totalSales = totalSales;
        }

        public BigDecimal getTotalCosts() {
            return totalCosts;
        }

        public void setTotalCosts(BigDecimal totalCosts) {
            this.totalCosts = totalCosts;
        }

        public BigDecimal getTotalExpenses() {
            return totalExpenses;
        }

        public void setTotalExpenses(BigDecimal totalExpenses) {
            this.totalExpenses = totalExpenses;
        }
    }

    public static class ErrorResponse {
        private String error;
        private String message;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }

        public String getError() {
            return error;
        }

        public String getMessage() {
            return message;
        }
    }

    public static class AggregationResponse {
        private String message;

        public AggregationResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
}
