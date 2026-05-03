package com.businessai.analytics.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.businessai.analytics.entity.BusinessMetric;
import com.businessai.analytics.repository.MetricsRepository;

/**
 * Unit tests for AnalyticsService.
 *
 * Validates: Requirements 2.3.1
 *
 * Covers:
 *  - Business logic methods (metric calculations)
 *  - Data aggregation (sum, average, count)
 *  - Calculation accuracy (verify formulas)
 *  - Exception handling (null data, not-found)
 *  - Data filtering and grouping
 *  - Repository dependency mocking
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTests {

    @Mock
    private MetricsRepository metricsRepository;

    private AnalyticsService service;

    @BeforeEach
    void setUp() {
        service = new AnalyticsService(metricsRepository);
    }

    // ── Helper factory ─────────────────────────────────────────────────────

    private BusinessMetric metric(Long id, int month, int year,
                                   double sales, double costs, double expenses) {
        BusinessMetric m = new BusinessMetric(month, year,
                BigDecimal.valueOf(sales),
                BigDecimal.valueOf(costs),
                BigDecimal.valueOf(expenses));
        m.setId(id);
        return m;
    }

    // ══════════════════════════════════════════════════════════════════════
    // getMetricById
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getMetricById")
    class GetMetricById {

        @Test
        @DisplayName("returns metric when found")
        void returnsMetricWhenFound() {
            BusinessMetric expected = metric(1L, 3, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findById(1L)).thenReturn(Optional.of(expected));

            BusinessMetric result = service.getMetricById(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals(3, result.getMonth());
            assertEquals(2024, result.getYear());
        }

        @Test
        @DisplayName("throws IllegalArgumentException when id is null")
        void throwsWhenIdIsNull() {
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.getMetricById(null));
            assertTrue(ex.getMessage().contains("null"));
        }

        @Test
        @DisplayName("throws IllegalArgumentException when metric not found")
        void throwsWhenNotFound() {
            when(metricsRepository.findById(999L)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.getMetricById(999L));
            assertTrue(ex.getMessage().contains("999"));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // getAllMetrics
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getAllMetrics")
    class GetAllMetrics {

        @Test
        @DisplayName("returns all metrics ordered by year and month")
        void returnsAllMetricsOrdered() {
            List<BusinessMetric> expected = List.of(
                    metric(1L, 1, 2024, 10_000, 5_000, 2_000),
                    metric(2L, 2, 2024, 12_000, 6_000, 2_000),
                    metric(3L, 3, 2024, 15_000, 7_000, 3_000)
            );
            when(metricsRepository.findAllByOrderByYearAscMonthAsc()).thenReturn(expected);

            List<BusinessMetric> result = service.getAllMetrics();

            assertEquals(3, result.size());
            assertEquals(1, result.get(0).getMonth());
            assertEquals(2, result.get(1).getMonth());
            assertEquals(3, result.get(2).getMonth());
        }

        @Test
        @DisplayName("returns empty list when no metrics exist")
        void returnsEmptyListWhenNoMetrics() {
            when(metricsRepository.findAllByOrderByYearAscMonthAsc()).thenReturn(new ArrayList<>());

            List<BusinessMetric> result = service.getAllMetrics();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // updateMetric
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("updateMetric")
    class UpdateMetric {

        @Test
        @DisplayName("updates all fields and recalculates profit")
        void updatesAllFieldsAndRecalculatesProfit() {
            BusinessMetric existing = metric(1L, 1, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(metricsRepository.save(any(BusinessMetric.class))).thenAnswer(inv -> inv.getArgument(0));

            BigDecimal newSales = BigDecimal.valueOf(80_000);
            BigDecimal newCosts = BigDecimal.valueOf(40_000);
            BigDecimal newExpenses = BigDecimal.valueOf(15_000);

            BusinessMetric result = service.updateMetric(1L, newSales, newCosts, newExpenses);

            assertEquals(0, result.getTotalSales().compareTo(newSales));
            assertEquals(0, result.getTotalCosts().compareTo(newCosts));
            assertEquals(0, result.getTotalExpenses().compareTo(newExpenses));
            // profit = 80000 - 40000 - 15000 = 25000
            assertEquals(0, result.getProfit().compareTo(BigDecimal.valueOf(25_000)));
        }

        @Test
        @DisplayName("partial update: only sales updated, others unchanged")
        void partialUpdateOnlySales() {
            BusinessMetric existing = metric(1L, 1, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(metricsRepository.save(any(BusinessMetric.class))).thenAnswer(inv -> inv.getArgument(0));

            BusinessMetric result = service.updateMetric(1L, BigDecimal.valueOf(70_000), null, null);

            assertEquals(0, result.getTotalSales().compareTo(BigDecimal.valueOf(70_000)));
            assertEquals(0, result.getTotalCosts().compareTo(BigDecimal.valueOf(30_000)));
            assertEquals(0, result.getTotalExpenses().compareTo(BigDecimal.valueOf(10_000)));
            // profit = 70000 - 30000 - 10000 = 30000
            assertEquals(0, result.getProfit().compareTo(BigDecimal.valueOf(30_000)));
        }

        @Test
        @DisplayName("negative value is ignored during update")
        void negativeValueIsIgnored() {
            BusinessMetric existing = metric(1L, 1, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(metricsRepository.save(any(BusinessMetric.class))).thenAnswer(inv -> inv.getArgument(0));

            // Negative sales should be ignored; original value kept
            BusinessMetric result = service.updateMetric(1L, BigDecimal.valueOf(-1), null, null);

            assertEquals(0, result.getTotalSales().compareTo(BigDecimal.valueOf(50_000)));
        }

        @Test
        @DisplayName("throws IllegalArgumentException when id is null")
        void throwsWhenIdIsNull() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.updateMetric(null, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
        }

        @Test
        @DisplayName("throws IllegalArgumentException when metric not found")
        void throwsWhenMetricNotFound() {
            when(metricsRepository.findById(42L)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class,
                    () -> service.updateMetric(42L, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
        }

        @Test
        @DisplayName("saves updated metric to repository")
        void savesUpdatedMetric() {
            BusinessMetric existing = metric(1L, 1, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(metricsRepository.save(any(BusinessMetric.class))).thenAnswer(inv -> inv.getArgument(0));

            service.updateMetric(1L, BigDecimal.valueOf(60_000), null, null);

            verify(metricsRepository).save(existing);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // deleteMetric
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("deleteMetric")
    class DeleteMetric {

        @Test
        @DisplayName("deletes existing metric successfully")
        void deletesExistingMetric() {
            when(metricsRepository.existsById(1L)).thenReturn(true);

            service.deleteMetric(1L);

            verify(metricsRepository).deleteById(1L);
        }

        @Test
        @DisplayName("throws IllegalArgumentException when id is null")
        void throwsWhenIdIsNull() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.deleteMetric(null));
            verify(metricsRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("throws IllegalArgumentException when metric not found")
        void throwsWhenNotFound() {
            when(metricsRepository.existsById(99L)).thenReturn(false);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.deleteMetric(99L));
            assertTrue(ex.getMessage().contains("99"));
            verify(metricsRepository, never()).deleteById(any());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // getDashboardSummary
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getDashboardSummary")
    class GetDashboardSummary {

        @Test
        @DisplayName("returns zero summary when no metrics in range")
        void returnsZeroSummaryWhenEmpty() {
            when(metricsRepository.findByDateRange(2024, 1, 2024, 12))
                    .thenReturn(new ArrayList<>());

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 12);

            assertEquals(0, summary.getTotalSales().compareTo(BigDecimal.ZERO));
            assertEquals(0, summary.getTotalCosts().compareTo(BigDecimal.ZERO));
            assertEquals(0, summary.getTotalProfit().compareTo(BigDecimal.ZERO));
            assertNull(summary.getBestMonth());
            assertNull(summary.getWorstMonth());
            assertTrue(summary.getTopProducts().isEmpty());
        }

        @Test
        @DisplayName("aggregates total sales correctly across multiple metrics")
        void aggregatesTotalSalesCorrectly() {
            List<BusinessMetric> metrics = List.of(
                    metric(1L, 1, 2024, 10_000, 5_000, 2_000),
                    metric(2L, 2, 2024, 20_000, 8_000, 3_000),
                    metric(3L, 3, 2024, 30_000, 12_000, 5_000)
            );
            when(metricsRepository.findByDateRange(2024, 1, 2024, 3)).thenReturn(metrics);

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 3);

            // total sales = 10000 + 20000 + 30000 = 60000
            assertEquals(0, summary.getTotalSales().compareTo(BigDecimal.valueOf(60_000)));
        }

        @Test
        @DisplayName("aggregates total costs correctly across multiple metrics")
        void aggregatesTotalCostsCorrectly() {
            List<BusinessMetric> metrics = List.of(
                    metric(1L, 1, 2024, 10_000, 5_000, 2_000),
                    metric(2L, 2, 2024, 20_000, 8_000, 3_000)
            );
            when(metricsRepository.findByDateRange(2024, 1, 2024, 2)).thenReturn(metrics);

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 2);

            // total costs = 5000 + 8000 = 13000
            assertEquals(0, summary.getTotalCosts().compareTo(BigDecimal.valueOf(13_000)));
        }

        @Test
        @DisplayName("aggregates total profit correctly across multiple metrics")
        void aggregatesTotalProfitCorrectly() {
            // profit per metric = sales - costs - expenses
            // m1: 10000 - 5000 - 2000 = 3000
            // m2: 20000 - 8000 - 3000 = 9000
            // total profit = 12000
            List<BusinessMetric> metrics = List.of(
                    metric(1L, 1, 2024, 10_000, 5_000, 2_000),
                    metric(2L, 2, 2024, 20_000, 8_000, 3_000)
            );
            when(metricsRepository.findByDateRange(2024, 1, 2024, 2)).thenReturn(metrics);

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 2);

            assertEquals(0, summary.getTotalProfit().compareTo(BigDecimal.valueOf(12_000)));
        }

        @Test
        @DisplayName("identifies best month by highest profit")
        void identifiesBestMonthByHighestProfit() {
            // m1 profit = 3000, m2 profit = 9000 → best = m2
            BusinessMetric m1 = metric(1L, 1, 2024, 10_000, 5_000, 2_000);
            BusinessMetric m2 = metric(2L, 2, 2024, 20_000, 8_000, 3_000);
            when(metricsRepository.findByDateRange(2024, 1, 2024, 2)).thenReturn(List.of(m1, m2));

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 2);

            assertNotNull(summary.getBestMonth());
            assertEquals(2, summary.getBestMonth().getMonth());
        }

        @Test
        @DisplayName("identifies worst month by lowest profit")
        void identifiesWorstMonthByLowestProfit() {
            // m1 profit = 3000, m2 profit = 9000 → worst = m1
            BusinessMetric m1 = metric(1L, 1, 2024, 10_000, 5_000, 2_000);
            BusinessMetric m2 = metric(2L, 2, 2024, 20_000, 8_000, 3_000);
            when(metricsRepository.findByDateRange(2024, 1, 2024, 2)).thenReturn(List.of(m1, m2));

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 2);

            assertNotNull(summary.getWorstMonth());
            assertEquals(1, summary.getWorstMonth().getMonth());
        }

        @Test
        @DisplayName("single metric is both best and worst month")
        void singleMetricIsBothBestAndWorst() {
            BusinessMetric m = metric(1L, 6, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findByDateRange(2024, 6, 2024, 6)).thenReturn(List.of(m));

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 6, 2024, 6);

            assertNotNull(summary.getBestMonth());
            assertNotNull(summary.getWorstMonth());
            assertEquals(summary.getBestMonth().getId(), summary.getWorstMonth().getId());
        }

        @Test
        @DisplayName("throws IllegalArgumentException when any date parameter is null")
        void throwsWhenDateParameterIsNull() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.getDashboardSummary(null, 1, 2024, 12));
            assertThrows(IllegalArgumentException.class,
                    () -> service.getDashboardSummary(2024, null, 2024, 12));
            assertThrows(IllegalArgumentException.class,
                    () -> service.getDashboardSummary(2024, 1, null, 12));
            assertThrows(IllegalArgumentException.class,
                    () -> service.getDashboardSummary(2024, 1, 2024, null));
        }

        @Test
        @DisplayName("top products list is always initialized (not null)")
        void topProductsListIsNeverNull() {
            when(metricsRepository.findByDateRange(2024, 1, 2024, 12))
                    .thenReturn(new ArrayList<>());

            AnalyticsService.DashboardSummary summary =
                    service.getDashboardSummary(2024, 1, 2024, 12);

            assertNotNull(summary.getTopProducts());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // DashboardSummary DTO
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("DashboardSummary DTO")
    class DashboardSummaryDto {

        @Test
        @DisplayName("getters return values passed to constructor")
        void gettersReturnConstructorValues() {
            BusinessMetric best = metric(1L, 6, 2024, 100_000, 40_000, 20_000);
            BusinessMetric worst = metric(2L, 1, 2024, 10_000, 8_000, 3_000);
            List<AnalyticsService.TopProduct> products = new ArrayList<>();

            AnalyticsService.DashboardSummary summary = new AnalyticsService.DashboardSummary(
                    BigDecimal.valueOf(110_000),
                    BigDecimal.valueOf(48_000),
                    BigDecimal.valueOf(44_000),
                    best,
                    worst,
                    products
            );

            assertEquals(0, summary.getTotalSales().compareTo(BigDecimal.valueOf(110_000)));
            assertEquals(0, summary.getTotalCosts().compareTo(BigDecimal.valueOf(48_000)));
            assertEquals(0, summary.getTotalProfit().compareTo(BigDecimal.valueOf(44_000)));
            assertEquals(best, summary.getBestMonth());
            assertEquals(worst, summary.getWorstMonth());
            assertEquals(products, summary.getTopProducts());
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // TopProduct DTO
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TopProduct DTO")
    class TopProductDto {

        @Test
        @DisplayName("getters return values passed to constructor")
        void gettersReturnConstructorValues() {
            AnalyticsService.TopProduct product = new AnalyticsService.TopProduct(
                    42L, "Widget Pro", BigDecimal.valueOf(99_999));

            assertEquals(42L, product.getProductId());
            assertEquals("Widget Pro", product.getProductName());
            assertEquals(0, product.getRevenue().compareTo(BigDecimal.valueOf(99_999)));
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // createMetric — duplicate detection
    // ══════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("createMetric — duplicate detection")
    class CreateMetricDuplicate {

        @Test
        @DisplayName("throws when metric already exists for month/year")
        void throwsWhenDuplicateMonthYear() {
            BusinessMetric existing = metric(1L, 6, 2024, 50_000, 30_000, 10_000);
            when(metricsRepository.findByMonthAndYear(6, 2024))
                    .thenReturn(Optional.of(existing));

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(6, 2024,
                            BigDecimal.valueOf(50_000),
                            BigDecimal.valueOf(30_000),
                            BigDecimal.valueOf(10_000)));
            assertTrue(ex.getMessage().contains("already exists"));
            verify(metricsRepository, never()).save(any());
        }

        @Test
        @DisplayName("throws for null month")
        void throwsForNullMonth() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(null, 2024,
                            BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
        }

        @Test
        @DisplayName("throws for null year")
        void throwsForNullYear() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(6, null,
                            BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE));
        }

        @Test
        @DisplayName("throws for null totalCosts")
        void throwsForNullTotalCosts() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(6, 2024,
                            BigDecimal.TEN, null, BigDecimal.ONE));
        }

        @Test
        @DisplayName("throws for null totalExpenses")
        void throwsForNullTotalExpenses() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(6, 2024,
                            BigDecimal.TEN, BigDecimal.ONE, null));
        }

        @Test
        @DisplayName("throws for negative totalCosts")
        void throwsForNegativeTotalCosts() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(6, 2024,
                            BigDecimal.TEN, BigDecimal.valueOf(-1), BigDecimal.ONE));
        }

        @Test
        @DisplayName("throws for negative totalExpenses")
        void throwsForNegativeTotalExpenses() {
            assertThrows(IllegalArgumentException.class,
                    () -> service.createMetric(6, 2024,
                            BigDecimal.TEN, BigDecimal.ONE, BigDecimal.valueOf(-1)));
        }
    }
}
