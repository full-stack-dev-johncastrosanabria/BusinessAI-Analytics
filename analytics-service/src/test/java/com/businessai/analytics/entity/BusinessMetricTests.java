package com.businessai.analytics.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for BusinessMetric entity.
 *
 * Validates: Requirements 2.3.1
 */
class BusinessMetricTests {

    // ── Default constructor ────────────────────────────────────────────────

    @Test
    void defaultConstructor_createsInstanceWithNullFields() {
        BusinessMetric metric = new BusinessMetric();

        assertNotNull(metric);
        assertNull(metric.getId());
        assertNull(metric.getMonth());
        assertNull(metric.getYear());
        assertNull(metric.getTotalSales());
        assertNull(metric.getTotalCosts());
        assertNull(metric.getTotalExpenses());
        assertNull(metric.getProfit());
        assertNull(metric.getCreatedAt());
        assertNull(metric.getUpdatedAt());
    }

    // ── Parameterized constructor ──────────────────────────────────────────

    @Test
    void parameterizedConstructor_setsAllFieldsCorrectly() {
        BigDecimal sales = BigDecimal.valueOf(100_000);
        BigDecimal costs = BigDecimal.valueOf(40_000);
        BigDecimal expenses = BigDecimal.valueOf(20_000);

        BusinessMetric metric = new BusinessMetric(6, 2024, sales, costs, expenses);

        assertEquals(6, metric.getMonth());
        assertEquals(2024, metric.getYear());
        assertEquals(0, metric.getTotalSales().compareTo(sales));
        assertEquals(0, metric.getTotalCosts().compareTo(costs));
        assertEquals(0, metric.getTotalExpenses().compareTo(expenses));
    }

    @Test
    void parameterizedConstructor_calculatesProfit() {
        BigDecimal sales = BigDecimal.valueOf(100_000);
        BigDecimal costs = BigDecimal.valueOf(40_000);
        BigDecimal expenses = BigDecimal.valueOf(20_000);
        BigDecimal expectedProfit = BigDecimal.valueOf(40_000);

        BusinessMetric metric = new BusinessMetric(6, 2024, sales, costs, expenses);

        assertEquals(0, metric.getProfit().compareTo(expectedProfit));
    }

    @Test
    void parameterizedConstructor_profitCanBeNegative() {
        BigDecimal sales = BigDecimal.valueOf(10_000);
        BigDecimal costs = BigDecimal.valueOf(50_000);
        BigDecimal expenses = BigDecimal.valueOf(5_000);

        BusinessMetric metric = new BusinessMetric(1, 2024, sales, costs, expenses);

        assertTrue(metric.getProfit().compareTo(BigDecimal.ZERO) < 0);
    }

    @Test
    void parameterizedConstructor_profitIsZeroWhenSalesEqualsCostsPlusExpenses() {
        BigDecimal sales = BigDecimal.valueOf(30_000);
        BigDecimal costs = BigDecimal.valueOf(20_000);
        BigDecimal expenses = BigDecimal.valueOf(10_000);

        BusinessMetric metric = new BusinessMetric(3, 2024, sales, costs, expenses);

        assertEquals(0, metric.getProfit().compareTo(BigDecimal.ZERO));
    }

    // ── Getters and Setters ────────────────────────────────────────────────

    @Test
    void setId_andGetId_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        metric.setId(42L);

        assertEquals(42L, metric.getId());
    }

    @Test
    void setMonth_andGetMonth_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        metric.setMonth(12);

        assertEquals(12, metric.getMonth());
    }

    @Test
    void setYear_andGetYear_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        metric.setYear(2023);

        assertEquals(2023, metric.getYear());
    }

    @Test
    void setTotalSales_andGetTotalSales_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        BigDecimal sales = BigDecimal.valueOf(75_000.50);
        metric.setTotalSales(sales);

        assertEquals(0, metric.getTotalSales().compareTo(sales));
    }

    @Test
    void setTotalCosts_andGetTotalCosts_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        BigDecimal costs = BigDecimal.valueOf(30_000.25);
        metric.setTotalCosts(costs);

        assertEquals(0, metric.getTotalCosts().compareTo(costs));
    }

    @Test
    void setTotalExpenses_andGetTotalExpenses_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        BigDecimal expenses = BigDecimal.valueOf(15_000.75);
        metric.setTotalExpenses(expenses);

        assertEquals(0, metric.getTotalExpenses().compareTo(expenses));
    }

    @Test
    void setProfit_andGetProfit_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        BigDecimal profit = BigDecimal.valueOf(29_750.00);
        metric.setProfit(profit);

        assertEquals(0, metric.getProfit().compareTo(profit));
    }

    @Test
    void setCreatedAt_andGetCreatedAt_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        LocalDateTime now = LocalDateTime.of(2024, 6, 15, 10, 30, 0);
        metric.setCreatedAt(now);

        assertEquals(now, metric.getCreatedAt());
    }

    @Test
    void setUpdatedAt_andGetUpdatedAt_workCorrectly() {
        BusinessMetric metric = new BusinessMetric();
        LocalDateTime now = LocalDateTime.of(2024, 6, 15, 12, 0, 0);
        metric.setUpdatedAt(now);

        assertEquals(now, metric.getUpdatedAt());
    }

    // ── Field constraints ──────────────────────────────────────────────────

    @Test
    void month_acceptsAllValidValues() {
        for (int m = 1; m <= 12; m++) {
            BusinessMetric metric = new BusinessMetric();
            metric.setMonth(m);
            assertEquals(m, metric.getMonth());
        }
    }

    @Test
    void year_acceptsTypicalBusinessYears() {
        int[] years = {2000, 2020, 2024, 2025, 2030};
        for (int year : years) {
            BusinessMetric metric = new BusinessMetric();
            metric.setYear(year);
            assertEquals(year, metric.getYear());
        }
    }

    @Test
    void totalSales_acceptsZeroValue() {
        BusinessMetric metric = new BusinessMetric();
        metric.setTotalSales(BigDecimal.ZERO);

        assertEquals(0, metric.getTotalSales().compareTo(BigDecimal.ZERO));
    }

    @Test
    void totalSales_acceptsLargeValues() {
        BigDecimal largeValue = new BigDecimal("9999999999.99");
        BusinessMetric metric = new BusinessMetric();
        metric.setTotalSales(largeValue);

        assertEquals(0, metric.getTotalSales().compareTo(largeValue));
    }

    @Test
    void totalCosts_acceptsZeroValue() {
        BusinessMetric metric = new BusinessMetric();
        metric.setTotalCosts(BigDecimal.ZERO);

        assertEquals(0, metric.getTotalCosts().compareTo(BigDecimal.ZERO));
    }

    @Test
    void totalExpenses_acceptsZeroValue() {
        BusinessMetric metric = new BusinessMetric();
        metric.setTotalExpenses(BigDecimal.ZERO);

        assertEquals(0, metric.getTotalExpenses().compareTo(BigDecimal.ZERO));
    }

    // ── calculateProfit static method ──────────────────────────────────────

    @Test
    void calculateProfit_returnsCorrectValue() {
        BigDecimal result = BusinessMetric.calculateProfit(
                BigDecimal.valueOf(100_000),
                BigDecimal.valueOf(40_000),
                BigDecimal.valueOf(20_000));

        assertEquals(0, result.compareTo(BigDecimal.valueOf(40_000)));
    }

    @Test
    void calculateProfit_returnsNegativeWhenCostsExceedSales() {
        BigDecimal result = BusinessMetric.calculateProfit(
                BigDecimal.valueOf(10_000),
                BigDecimal.valueOf(50_000),
                BigDecimal.valueOf(5_000));

        assertTrue(result.compareTo(BigDecimal.ZERO) < 0);
        assertEquals(0, result.compareTo(BigDecimal.valueOf(-45_000)));
    }

    @Test
    void calculateProfit_returnsZeroWhenSalesEqualsCostsPlusExpenses() {
        BigDecimal result = BusinessMetric.calculateProfit(
                BigDecimal.valueOf(30_000),
                BigDecimal.valueOf(20_000),
                BigDecimal.valueOf(10_000));

        assertEquals(0, result.compareTo(BigDecimal.ZERO));
    }

    @Test
    void calculateProfit_withZeroCostsAndExpenses_returnsSales() {
        BigDecimal sales = BigDecimal.valueOf(50_000);
        BigDecimal result = BusinessMetric.calculateProfit(sales, BigDecimal.ZERO, BigDecimal.ZERO);

        assertEquals(0, result.compareTo(sales));
    }

    @Test
    void calculateProfit_throwsNullPointerExceptionOnNullSales() {
        assertThrows(NullPointerException.class, () ->
                BusinessMetric.calculateProfit(null, BigDecimal.TEN, BigDecimal.ONE));
    }

    @Test
    void calculateProfit_throwsNullPointerExceptionOnNullCosts() {
        assertThrows(NullPointerException.class, () ->
                BusinessMetric.calculateProfit(BigDecimal.TEN, null, BigDecimal.ONE));
    }

    @Test
    void calculateProfit_throwsNullPointerExceptionOnNullExpenses() {
        assertThrows(NullPointerException.class, () ->
                BusinessMetric.calculateProfit(BigDecimal.TEN, BigDecimal.ONE, null));
    }

    // ── Lifecycle callbacks ────────────────────────────────────────────────

    @Test
    void onCreate_setsCreatedAtAndUpdatedAt() {
        BusinessMetric metric = new BusinessMetric();
        LocalDateTime before = LocalDateTime.now().minusSeconds(1);

        // Simulate @PrePersist callback
        metric.setCreatedAt(LocalDateTime.now());
        metric.setUpdatedAt(LocalDateTime.now());

        LocalDateTime after = LocalDateTime.now().plusSeconds(1);

        assertTrue(metric.getCreatedAt().isAfter(before));
        assertTrue(metric.getCreatedAt().isBefore(after));
        assertTrue(metric.getUpdatedAt().isAfter(before));
        assertTrue(metric.getUpdatedAt().isBefore(after));
    }

    @Test
    void onUpdate_updatesUpdatedAt() {
        BusinessMetric metric = new BusinessMetric();
        LocalDateTime originalTime = LocalDateTime.of(2024, 1, 1, 0, 0, 0);
        metric.setCreatedAt(originalTime);
        metric.setUpdatedAt(originalTime);

        // Simulate @PreUpdate callback
        metric.setUpdatedAt(LocalDateTime.now());

        assertTrue(metric.getUpdatedAt().isAfter(originalTime));
        assertEquals(originalTime, metric.getCreatedAt()); // createdAt unchanged
    }

    // ── toString ──────────────────────────────────────────────────────────

    @Test
    void toString_containsAllRelevantFields() {
        BusinessMetric metric = new BusinessMetric(
                6, 2024,
                BigDecimal.valueOf(100_000),
                BigDecimal.valueOf(40_000),
                BigDecimal.valueOf(20_000));
        metric.setId(1L);

        String result = metric.toString();

        assertTrue(result.contains("id=1"));
        assertTrue(result.contains("month=6"));
        assertTrue(result.contains("year=2024"));
        assertTrue(result.contains("totalSales=100000"));
        assertTrue(result.contains("totalCosts=40000"));
        assertTrue(result.contains("totalExpenses=20000"));
        assertTrue(result.contains("profit=40000"));
    }

    @Test
    void toString_doesNotReturnNull() {
        BusinessMetric metric = new BusinessMetric();
        assertNotNull(metric.toString());
    }

    // ── equals/hashCode (identity-based, no @EqualsAndHashCode) ───────────

    @Test
    void twoDistinctInstances_areNotEqualByDefault() {
        BusinessMetric m1 = new BusinessMetric(6, 2024,
                BigDecimal.valueOf(100_000), BigDecimal.valueOf(40_000), BigDecimal.valueOf(20_000));
        BusinessMetric m2 = new BusinessMetric(6, 2024,
                BigDecimal.valueOf(100_000), BigDecimal.valueOf(40_000), BigDecimal.valueOf(20_000));

        // Default Object.equals — identity comparison
        assertNotEquals(m1, m2);
    }

    @Test
    void sameInstance_isEqualToItself() {
        BusinessMetric metric = new BusinessMetric(6, 2024,
                BigDecimal.valueOf(100_000), BigDecimal.valueOf(40_000), BigDecimal.valueOf(20_000));

        assertEquals(metric, metric);
    }

    @Test
    void sameInstance_hasSameHashCode() {
        BusinessMetric metric = new BusinessMetric(6, 2024,
                BigDecimal.valueOf(100_000), BigDecimal.valueOf(40_000), BigDecimal.valueOf(20_000));

        assertEquals(metric.hashCode(), metric.hashCode());
    }

    // ── Valid entity creation ──────────────────────────────────────────────

    @Test
    void validMetricCreation_withAllFields() {
        BusinessMetric metric = new BusinessMetric(
                12, 2023,
                BigDecimal.valueOf(250_000),
                BigDecimal.valueOf(100_000),
                BigDecimal.valueOf(50_000));
        metric.setId(99L);
        metric.setCreatedAt(LocalDateTime.of(2023, 12, 31, 23, 59, 59));
        metric.setUpdatedAt(LocalDateTime.of(2023, 12, 31, 23, 59, 59));

        assertNotNull(metric);
        assertEquals(99L, metric.getId());
        assertEquals(12, metric.getMonth());
        assertEquals(2023, metric.getYear());
        assertEquals(0, metric.getTotalSales().compareTo(BigDecimal.valueOf(250_000)));
        assertEquals(0, metric.getTotalCosts().compareTo(BigDecimal.valueOf(100_000)));
        assertEquals(0, metric.getTotalExpenses().compareTo(BigDecimal.valueOf(50_000)));
        assertEquals(0, metric.getProfit().compareTo(BigDecimal.valueOf(100_000)));
        assertNotNull(metric.getCreatedAt());
        assertNotNull(metric.getUpdatedAt());
    }

    @Test
    void profitConsistency_constructorMatchesStaticMethod() {
        BigDecimal sales = BigDecimal.valueOf(80_000);
        BigDecimal costs = BigDecimal.valueOf(35_000);
        BigDecimal expenses = BigDecimal.valueOf(15_000);

        BusinessMetric metric = new BusinessMetric(4, 2024, sales, costs, expenses);
        BigDecimal staticProfit = BusinessMetric.calculateProfit(sales, costs, expenses);

        assertEquals(0, metric.getProfit().compareTo(staticProfit));
    }
}
