package com.businessai.analytics.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.businessai.analytics.entity.BusinessMetric;
import com.businessai.analytics.repository.MetricsRepository;

/**
 * Unit tests for AnalyticsService — calculateProfit and getMetricsByDateRange validation.
 * Tests the service layer directly without Spring context.
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceUnitTest {

    @Mock
    private MetricsRepository metricsRepository;

    private AnalyticsService service;

    @BeforeEach
    void setUp() {
        service = new AnalyticsService(metricsRepository);
    }

    // ── calculateProfit ────────────────────────────────────────────────────

    @Test
    void calculateProfit_returnsCorrectValue() {
        BigDecimal profit = service.calculateProfit(
                BigDecimal.valueOf(100_000),
                BigDecimal.valueOf(40_000),
                BigDecimal.valueOf(20_000));
        assertEquals(0, profit.compareTo(BigDecimal.valueOf(40_000)));
    }

    @Test
    void calculateProfit_canBeNegativeWhenCostsExceedSales() {
        BigDecimal profit = service.calculateProfit(
                BigDecimal.valueOf(10_000),
                BigDecimal.valueOf(50_000),
                BigDecimal.valueOf(5_000));
        assertTrue(profit.compareTo(BigDecimal.ZERO) < 0);
    }

    @Test
    void calculateProfit_isZeroWhenSalesEqualsCostsPlusExpenses() {
        BigDecimal profit = service.calculateProfit(
                BigDecimal.valueOf(30_000),
                BigDecimal.valueOf(20_000),
                BigDecimal.valueOf(10_000));
        assertEquals(0, profit.compareTo(BigDecimal.ZERO));
    }

    @Test
    void calculateProfit_throwsOnNullSales() {
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateProfit(null, BigDecimal.TEN, BigDecimal.ONE));
    }

    @Test
    void calculateProfit_throwsOnNullCosts() {
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateProfit(BigDecimal.TEN, null, BigDecimal.ONE));
    }

    @Test
    void calculateProfit_throwsOnNullExpenses() {
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateProfit(BigDecimal.TEN, BigDecimal.ONE, null));
    }

    // ── getMetricsByDateRange — validation ─────────────────────────────────

    @Test
    void getMetricsByDateRange_throwsWhenStartYearIsNull() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(null, 1, 2024, 12));
    }

    @Test
    void getMetricsByDateRange_throwsWhenStartMonthIsNull() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, null, 2024, 12));
    }

    @Test
    void getMetricsByDateRange_throwsWhenEndYearIsNull() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 1, null, 12));
    }

    @Test
    void getMetricsByDateRange_throwsWhenEndMonthIsNull() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 1, 2024, null));
    }

    @Test
    void getMetricsByDateRange_throwsWhenStartMonthOutOfRange() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 0, 2024, 12));
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 13, 2024, 12));
    }

    @Test
    void getMetricsByDateRange_throwsWhenEndMonthOutOfRange() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 1, 2024, 0));
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 1, 2024, 13));
    }

    @Test
    void getMetricsByDateRange_throwsWhenStartDateAfterEndDate() {
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2024, 6, 2024, 1));
        assertThrows(IllegalArgumentException.class, () ->
                service.getMetricsByDateRange(2025, 1, 2024, 12));
    }

    @Test
    void getMetricsByDateRange_acceptsSameDateRange() {
        BusinessMetric metric = new BusinessMetric(6, 2024,
                BigDecimal.valueOf(50_000), BigDecimal.valueOf(30_000), BigDecimal.valueOf(10_000));
        when(metricsRepository.findByDateRange(2024, 6, 2024, 6))
                .thenReturn(List.of(metric));

        List<BusinessMetric> result = service.getMetricsByDateRange(2024, 6, 2024, 6);
        assertEquals(1, result.size());
    }

    @Test
    void getMetricsByDateRange_returnsRepositoryResults() {
        BusinessMetric m1 = new BusinessMetric(1, 2024,
                BigDecimal.valueOf(10_000), BigDecimal.valueOf(5_000), BigDecimal.valueOf(2_000));
        BusinessMetric m2 = new BusinessMetric(2, 2024,
                BigDecimal.valueOf(12_000), BigDecimal.valueOf(6_000), BigDecimal.valueOf(2_000));
        when(metricsRepository.findByDateRange(2024, 1, 2024, 12))
                .thenReturn(List.of(m1, m2));

        List<BusinessMetric> result = service.getMetricsByDateRange(2024, 1, 2024, 12);
        assertEquals(2, result.size());
    }

    // ── createMetric — validation ──────────────────────────────────────────

    @Test
    void createMetric_throwsForInvalidMonth() {
        assertThrows(IllegalArgumentException.class, () ->
                service.createMetric(0, 2024, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
        assertThrows(IllegalArgumentException.class, () ->
                service.createMetric(13, 2024, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
    }

    @Test
    void createMetric_throwsForInvalidYear() {
        assertThrows(IllegalArgumentException.class, () ->
                service.createMetric(6, 1899, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
        assertThrows(IllegalArgumentException.class, () ->
                service.createMetric(6, 2101, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
    }

    @Test
    void createMetric_throwsForNegativeSales() {
        assertThrows(IllegalArgumentException.class, () ->
                service.createMetric(6, 2024, BigDecimal.valueOf(-1), BigDecimal.ONE, BigDecimal.ONE));
    }

    @Test
    void createMetric_savesMetricWithCorrectProfit() {
        BigDecimal sales = BigDecimal.valueOf(50_000);
        BigDecimal costs = BigDecimal.valueOf(30_000);
        BigDecimal expenses = BigDecimal.valueOf(10_000);
        BigDecimal expectedProfit = BigDecimal.valueOf(10_000);

        when(metricsRepository.findByMonthAndYear(6, 2024)).thenReturn(Optional.empty());
        when(metricsRepository.save(any(BusinessMetric.class))).thenAnswer(inv -> {
            BusinessMetric m = inv.getArgument(0);
            m.setId(1L);
            return m;
        });

        BusinessMetric result = service.createMetric(6, 2024, sales, costs, expenses);

        assertNotNull(result);
        assertEquals(0, result.getProfit().compareTo(expectedProfit));
    }
}
