package com.businessai.sales.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.businessai.sales.client.CustomerClient;
import com.businessai.sales.client.ProductClient;
import com.businessai.sales.entity.SalesTransaction;
import com.businessai.sales.repository.SalesRepository;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.Positive;
import net.jqwik.api.lifecycle.BeforeTry;

/**
 * Property-based tests for Sales Transaction Filtering Correctness.
 * 
 * **Validates: Requirements 3.5**
 */
class SalesTransactionFilteringProperties {

    private SalesRepository salesRepository;
    private CustomerClient customerClient;
    private ProductClient productClient;
    private SalesService salesService;

    @BeforeTry
    void setUp() {
        // Initialize mocks before each property test try
        salesRepository = mock(SalesRepository.class);
        customerClient = mock(CustomerClient.class);
        productClient = mock(ProductClient.class);
        salesService = new SalesService(salesRepository, customerClient, productClient);
    }

    /**
     * Property 7: Sales Transaction Filtering Correctness
     * 
     * **Validates: Requirements 3.5**
     * 
     * For any sales transaction query with filters (date range, customer ID, or product ID),
     * all returned transactions SHALL match the specified filter criteria.
     */
    @Property
    @Label("Filtering by date range returns only transactions within the date range")
    void filteringByDateRange_returnsOnlyTransactionsWithinRange(
            @ForAll("dateRanges") DateRange dateRange) {
        
        // Arrange - Create test transactions within the range
        SalesTransaction transaction1 = new SalesTransaction(1L, 1L, dateRange.startDate, 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        // Calculate a middle date within the range
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(dateRange.startDate, dateRange.endDate);
        LocalDate middleDate = dateRange.startDate.plusDays(daysBetween / 2);
        
        SalesTransaction transaction2 = new SalesTransaction(1L, 1L, middleDate, 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        SalesTransaction transaction3 = new SalesTransaction(1L, 1L, dateRange.endDate, 2, new BigDecimal("50.00"));
        transaction3.setId(3L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2, transaction3);
        
        when(salesRepository.findByTransactionDateBetween(dateRange.startDate, dateRange.endDate))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(dateRange.startDate, dateRange.endDate, null, null);

        // Assert - All returned transactions should be within the date range
        assertEquals(3, result.size(), "Should return exactly 3 transactions within the date range");
        
        for (SalesTransaction transaction : result) {
            assertTrue(
                !transaction.getTransactionDate().isBefore(dateRange.startDate) &&
                !transaction.getTransactionDate().isAfter(dateRange.endDate),
                "Transaction date " + transaction.getTransactionDate() + 
                " should be within range [" + dateRange.startDate + ", " + dateRange.endDate + "]"
            );
        }
    }

    /**
     * Property test for filtering by customer ID
     */
    @Property
    @Label("Filtering by customer ID returns only transactions for that customer")
    void filteringByCustomerId_returnsOnlyTransactionsForCustomer(
            @ForAll @Positive Long customerId) {
        
        // Arrange - Create test transactions for the specified customer
        SalesTransaction transaction1 = new SalesTransaction(customerId, 1L, LocalDate.of(2024, 1, 15), 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        SalesTransaction transaction2 = new SalesTransaction(customerId, 2L, LocalDate.of(2024, 1, 20), 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        // Transaction for a different customer
        SalesTransaction transaction3 = new SalesTransaction(customerId + 1, 1L, LocalDate.of(2024, 1, 25), 2, new BigDecimal("50.00"));
        transaction3.setId(3L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2);
        
        when(salesRepository.findByCustomerId(customerId))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, customerId, null);

        // Assert - All returned transactions should be for the specified customer
        assertEquals(2, result.size(), "Should return exactly 2 transactions for the customer");
        
        for (SalesTransaction transaction : result) {
            assertEquals(customerId, transaction.getCustomerId(),
                "Transaction should belong to customer " + customerId);
        }
    }

    /**
     * Property test for filtering by product ID
     */
    @Property
    @Label("Filtering by product ID returns only transactions for that product")
    void filteringByProductId_returnsOnlyTransactionsForProduct(
            @ForAll @Positive Long productId) {
        
        // Arrange - Create test transactions for the specified product
        SalesTransaction transaction1 = new SalesTransaction(1L, productId, LocalDate.of(2024, 1, 15), 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        SalesTransaction transaction2 = new SalesTransaction(2L, productId, LocalDate.of(2024, 1, 20), 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        // Transaction for a different product
        SalesTransaction transaction3 = new SalesTransaction(1L, productId + 1, LocalDate.of(2024, 1, 25), 2, new BigDecimal("50.00"));
        transaction3.setId(3L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2);
        
        when(salesRepository.findByProductId(productId))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, null, productId);

        // Assert - All returned transactions should be for the specified product
        assertEquals(2, result.size(), "Should return exactly 2 transactions for the product");
        
        for (SalesTransaction transaction : result) {
            assertEquals(productId, transaction.getProductId(),
                "Transaction should be for product " + productId);
        }
    }

    /**
     * Property test for filtering by date range AND customer ID
     */
    @Property
    @Label("Filtering by date range and customer ID returns only matching transactions")
    void filteringByDateRangeAndCustomerId_returnsOnlyMatchingTransactions(
            @ForAll("dateRanges") DateRange dateRange,
            @ForAll @Positive Long customerId) {
        
        // Arrange - Create test transactions
        SalesTransaction transaction1 = new SalesTransaction(customerId, 1L, dateRange.startDate, 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        // Calculate a middle date within the range
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(dateRange.startDate, dateRange.endDate);
        LocalDate middleDate = dateRange.startDate.plusDays(daysBetween / 2);
        
        SalesTransaction transaction2 = new SalesTransaction(customerId, 2L, middleDate, 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2);
        
        when(salesRepository.findByCustomerIdAndDateBetween(customerId, dateRange.startDate, dateRange.endDate))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(dateRange.startDate, dateRange.endDate, customerId, null);

        // Assert - All returned transactions should match BOTH criteria
        assertEquals(2, result.size(), "Should return exactly 2 transactions matching both criteria");
        
        for (SalesTransaction transaction : result) {
            assertEquals(customerId, transaction.getCustomerId(),
                "Transaction should belong to customer " + customerId);
            assertTrue(
                !transaction.getTransactionDate().isBefore(dateRange.startDate) &&
                !transaction.getTransactionDate().isAfter(dateRange.endDate),
                "Transaction date should be within range [" + dateRange.startDate + ", " + dateRange.endDate + "]"
            );
        }
    }

    /**
     * Property test for filtering by date range AND product ID
     */
    @Property
    @Label("Filtering by date range and product ID returns only matching transactions")
    void filteringByDateRangeAndProductId_returnsOnlyMatchingTransactions(
            @ForAll("dateRanges") DateRange dateRange,
            @ForAll @Positive Long productId) {
        
        // Arrange - Create test transactions
        SalesTransaction transaction1 = new SalesTransaction(1L, productId, dateRange.startDate, 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        // Calculate a middle date within the range
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(dateRange.startDate, dateRange.endDate);
        LocalDate middleDate = dateRange.startDate.plusDays(daysBetween / 2);
        
        SalesTransaction transaction2 = new SalesTransaction(2L, productId, middleDate, 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2);
        
        when(salesRepository.findByProductIdAndDateBetween(productId, dateRange.startDate, dateRange.endDate))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(dateRange.startDate, dateRange.endDate, null, productId);

        // Assert - All returned transactions should match BOTH criteria
        assertEquals(2, result.size(), "Should return exactly 2 transactions matching both criteria");
        
        for (SalesTransaction transaction : result) {
            assertEquals(productId, transaction.getProductId(),
                "Transaction should be for product " + productId);
            assertTrue(
                !transaction.getTransactionDate().isBefore(dateRange.startDate) &&
                !transaction.getTransactionDate().isAfter(dateRange.endDate),
                "Transaction date should be within range [" + dateRange.startDate + ", " + dateRange.endDate + "]"
            );
        }
    }

    /**
     * Property test for filtering by customer ID AND product ID
     */
    @Property
    @Label("Filtering by customer ID and product ID returns only matching transactions")
    void filteringByCustomerIdAndProductId_returnsOnlyMatchingTransactions(
            @ForAll @Positive Long customerId,
            @ForAll @Positive Long productId) {
        
        // Arrange - Create test transactions
        SalesTransaction transaction1 = new SalesTransaction(customerId, productId, LocalDate.of(2024, 1, 15), 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        SalesTransaction transaction2 = new SalesTransaction(customerId, productId, LocalDate.of(2024, 1, 20), 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        // Transaction with same customer but different product
        SalesTransaction transaction3 = new SalesTransaction(customerId, productId + 1, LocalDate.of(2024, 1, 25), 2, new BigDecimal("50.00"));
        transaction3.setId(3L);
        
        // Transaction with same product but different customer
        SalesTransaction transaction4 = new SalesTransaction(customerId + 1, productId, LocalDate.of(2024, 1, 30), 1, new BigDecimal("25.00"));
        transaction4.setId(4L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2);
        
        when(salesRepository.findByCustomerIdAndProductId(customerId, productId))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, customerId, productId);

        // Assert - All returned transactions should match BOTH criteria
        assertEquals(2, result.size(), "Should return exactly 2 transactions matching both criteria");
        
        for (SalesTransaction transaction : result) {
            assertEquals(customerId, transaction.getCustomerId(),
                "Transaction should belong to customer " + customerId);
            assertEquals(productId, transaction.getProductId(),
                "Transaction should be for product " + productId);
        }
    }

    /**
     * Property test for filtering by all three criteria: date range, customer ID, and product ID
     */
    @Property
    @Label("Filtering by date range, customer ID, and product ID returns only matching transactions")
    void filteringByAllCriteria_returnsOnlyMatchingTransactions(
            @ForAll("dateRanges") DateRange dateRange,
            @ForAll @Positive Long customerId,
            @ForAll @Positive Long productId) {
        
        // Arrange - Create test transactions
        SalesTransaction transaction1 = new SalesTransaction(customerId, productId, dateRange.startDate, 5, new BigDecimal("100.00"));
        transaction1.setId(1L);
        
        // Calculate a middle date within the range
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(dateRange.startDate, dateRange.endDate);
        LocalDate middleDate = dateRange.startDate.plusDays(daysBetween / 2);
        
        SalesTransaction transaction2 = new SalesTransaction(customerId, productId, middleDate, 3, new BigDecimal("75.00"));
        transaction2.setId(2L);
        
        List<SalesTransaction> filteredTransactions = List.of(transaction1, transaction2);
        
        when(salesRepository.findByCustomerIdAndProductIdAndDateBetween(customerId, productId, dateRange.startDate, dateRange.endDate))
            .thenReturn(filteredTransactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(dateRange.startDate, dateRange.endDate, customerId, productId);

        // Assert - All returned transactions should match ALL criteria
        assertEquals(2, result.size(), "Should return exactly 2 transactions matching all criteria");
        
        for (SalesTransaction transaction : result) {
            assertEquals(customerId, transaction.getCustomerId(),
                "Transaction should belong to customer " + customerId);
            assertEquals(productId, transaction.getProductId(),
                "Transaction should be for product " + productId);
            assertTrue(
                !transaction.getTransactionDate().isBefore(dateRange.startDate) &&
                !transaction.getTransactionDate().isAfter(dateRange.endDate),
                "Transaction date should be within range [" + dateRange.startDate + ", " + dateRange.endDate + "]"
            );
        }
    }

    /**
     * Property test for empty result when no transactions match the filters
     */
    @Property
    @Label("Filtering with no matching transactions returns empty list")
    void filteringWithNoMatches_returnsEmptyList(
            @ForAll @Positive Long customerId) {
        
        // Arrange - Mock repository to return empty list
        when(salesRepository.findByCustomerId(customerId))
            .thenReturn(List.of());

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, customerId, null);

        // Assert - Result should be empty
        assertTrue(result.isEmpty(), "Should return empty list when no transactions match the filter");
        assertEquals(0, result.size(), "Result size should be 0");
    }

    // Arbitraries (Generators)

    @Provide
    Arbitrary<DateRange> dateRanges() {
        return Arbitraries.integers()
            .between(1, 27)
            .flatMap(startDay -> 
                Arbitraries.integers()
                    .between(startDay + 1, 28)
                    .map(endDay -> new DateRange(
                        LocalDate.of(2024, 1, startDay),
                        LocalDate.of(2024, 1, endDay)
                    ))
            );
    }

    /**
     * Helper class to represent a date range for testing
     */
    static class DateRange {
        LocalDate startDate;
        LocalDate endDate;

        DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }
    }
}
