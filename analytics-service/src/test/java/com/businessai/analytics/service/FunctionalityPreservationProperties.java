package com.businessai.analytics.service;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import com.businessai.analytics.entity.BusinessMetric;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.Report;
import net.jqwik.api.Reporting;
import net.jqwik.api.Tag;
import net.jqwik.api.constraints.BigRange;
import net.jqwik.api.constraints.IntRange;

/**
 * Property 8: Functionality Preservation During Bug Fixes
 *
 * For any bug fix applied to Java services, the Issue_Resolver SHALL maintain all
 * existing functionality as verified by existing test suites passing after the fix is applied.
 *
 * **Validates: Requirements 2.4**
 */
@Tag("business-ai-analytics")
public class FunctionalityPreservationProperties {

    /**
     * Property: calculateProfit(sales, costs, expenses) = sales - costs - expenses
     * for any non-negative BigDecimal values.
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void profitCalculationFormula(
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal sales,
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal costs,
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal expenses) {

        BigDecimal expected = sales.subtract(costs).subtract(expenses);
        BigDecimal actual = BusinessMetric.calculateProfit(sales, costs, expenses);

        assertEquals(0, actual.compareTo(expected),
            String.format("calculateProfit(%s, %s, %s) should equal %s but was %s",
                sales, costs, expenses, expected, actual));
    }

    /**
     * Property: calculateProfit is consistent — same inputs always produce same output.
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void profitCalculationIsConsistent(
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal sales,
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal costs,
            @ForAll @BigRange(min = "0", max = "1000000") BigDecimal expenses) {

        BigDecimal first = BusinessMetric.calculateProfit(sales, costs, expenses);
        BigDecimal second = BusinessMetric.calculateProfit(sales, costs, expenses);

        assertEquals(0, first.compareTo(second),
            "calculateProfit must be deterministic: same inputs must always yield the same result");
    }

    /**
     * Property: profit can be negative when costs + expenses > sales.
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void profitCanBeNegativeWhenCostsPlusCostsExceedSales(
            @ForAll @BigRange(min = "0", max = "100000") BigDecimal sales,
            @ForAll @BigRange(min = "100001", max = "1000000") BigDecimal costs,
            @ForAll @BigRange(min = "0", max = "100000") BigDecimal expenses) {

        BigDecimal profit = BusinessMetric.calculateProfit(sales, costs, expenses);

        assertTrue(profit.compareTo(BigDecimal.ZERO) < 0,
            String.format("Profit should be negative when costs (%s) exceed sales (%s), but was %s",
                costs, sales, profit));
    }

    /**
     * Property: createMetric validates month range [1-12] — any month outside this range
     * throws IllegalArgumentException.
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void createMetricRejectsInvalidMonths(
            @ForAll("invalidMonths") int invalidMonth) {

        assertThrows(IllegalArgumentException.class, () ->
            new AnalyticsService(null).createMetric(
                invalidMonth, 2024,
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE),
            "createMetric should throw IllegalArgumentException for month " + invalidMonth);
    }

    /**
     * Property: createMetric validates year range [1900-2100].
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void createMetricRejectsInvalidYears(
            @ForAll("invalidYears") int invalidYear) {

        assertThrows(IllegalArgumentException.class, () ->
            new AnalyticsService(null).createMetric(
                6, invalidYear,
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE),
            "createMetric should throw IllegalArgumentException for year " + invalidYear);
    }

    /**
     * Property: createMetric accepts all valid months [1-12].
     * Validation passes before any repository interaction.
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void createMetricAcceptsValidMonths(
            @ForAll @IntRange(min = 1, max = 12) int validMonth) {

        // The service should NOT throw IllegalArgumentException for valid months.
        // It will throw NullPointerException when it reaches the repository call (null repo),
        // which confirms validation passed.
        try {
            new AnalyticsService(null).createMetric(
                validMonth, 2024,
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE);
        } catch (IllegalArgumentException e) {
            fail("createMetric should not throw IllegalArgumentException for valid month " + validMonth
                + ": " + e.getMessage());
        } catch (Exception e) {
            // NullPointerException from null repository is expected — validation passed
        }
    }

    /**
     * Property: createMetric accepts all valid years [1900-2100].
     *
     * **Validates: Requirements 2.4**
     */
    @Property
    @Report(Reporting.GENERATED)
    void createMetricAcceptsValidYears(
            @ForAll @IntRange(min = 1900, max = 2100) int validYear) {

        try {
            new AnalyticsService(null).createMetric(
                6, validYear,
                BigDecimal.TEN, BigDecimal.ONE, BigDecimal.ONE);
        } catch (IllegalArgumentException e) {
            fail("createMetric should not throw IllegalArgumentException for valid year " + validYear
                + ": " + e.getMessage());
        } catch (Exception e) {
            // NullPointerException from null repository is expected — validation passed
        }
    }

    // --- Arbitraries ---

    @Provide
    Arbitrary<Integer> invalidMonths() {
        return Arbitraries.oneOf(
            Arbitraries.integers().lessOrEqual(0),
            Arbitraries.integers().greaterOrEqual(13)
        );
    }

    @Provide
    Arbitrary<Integer> invalidYears() {
        return Arbitraries.oneOf(
            Arbitraries.integers().lessOrEqual(1899),
            Arbitraries.integers().greaterOrEqual(2101)
        );
    }
}
