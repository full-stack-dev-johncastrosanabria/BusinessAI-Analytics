package com.businessai.sales.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.businessai.sales.client.CustomerClient;
import com.businessai.sales.client.ProductClient;
import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.entity.SalesTransaction;
import com.businessai.sales.exception.SalesValidationException;
import com.businessai.sales.repository.SalesRepository;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.BigRange;
import net.jqwik.api.constraints.Positive;
import net.jqwik.api.lifecycle.BeforeTry;

/**
 * Property-based tests for Sales Transaction Total Calculation.
 * 
 * **Validates: Requirements 3.3**
 */
class SalesTransactionTotalCalculationProperties {

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
     * Property 6: Sales Transaction Total Calculation
     * 
     * **Validates: Requirements 3.3**
     * 
     * For any sales transaction with quantity Q and product price P, 
     * the calculated total amount SHALL equal Q × P.
     */
    @Property
    @Label("Sales transaction total calculation equals quantity × price")
    void salesTransactionTotalCalculation_equalsQuantityTimesPrice(
            @ForAll @Positive Integer quantity,
            @ForAll @BigRange(min = "0.01", max = "10000.00") BigDecimal price) {
        
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        
        // Mock customer exists
        CustomerDTO customer = new CustomerDTO(customerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        
        // Mock product exists with the generated price
        ProductDTO product = new ProductDTO(productId, "Test Product", "Electronics", 
                                           new BigDecimal("100.00"), price);
        when(productClient.getProductById(productId)).thenReturn(product);
        
        // Mock repository save to return the transaction with calculated total
        when(salesRepository.save(any(SalesTransaction.class))).thenAnswer(invocation -> {
            SalesTransaction transaction = invocation.getArgument(0);
            transaction.setId(1L); // Set ID as if saved
            return transaction;
        });

        // Act
        SalesTransaction result = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert - Total amount should equal quantity × price
        BigDecimal expectedTotal = price.multiply(new BigDecimal(quantity));
        assertEquals(expectedTotal, result.getTotalAmount(),
                    "Total amount should equal quantity (" + quantity + ") × price (" + price + ")");
    }

    /**
     * Property test for edge case: minimum valid values
     */
    @Property
    @Label("Sales transaction total calculation with minimum valid values")
    void salesTransactionTotalCalculation_minimumValidValues(
            @ForAll("minimumQuantities") Integer quantity,
            @ForAll("minimumPrices") BigDecimal price) {
        
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        
        // Mock customer exists
        CustomerDTO customer = new CustomerDTO(customerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        
        // Mock product exists with the generated price
        ProductDTO product = new ProductDTO(productId, "Test Product", "Electronics", 
                                           new BigDecimal("50.00"), price);
        when(productClient.getProductById(productId)).thenReturn(product);
        
        // Mock repository save
        when(salesRepository.save(any(SalesTransaction.class))).thenAnswer(invocation -> {
            SalesTransaction transaction = invocation.getArgument(0);
            transaction.setId(1L);
            return transaction;
        });

        // Act
        SalesTransaction result = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        BigDecimal expectedTotal = price.multiply(new BigDecimal(quantity));
        assertEquals(expectedTotal, result.getTotalAmount(),
                    "Total amount should equal quantity (" + quantity + ") × price (" + price + ")");
    }

    /**
     * Property test for edge case: maximum reasonable values
     */
    @Property
    @Label("Sales transaction total calculation with maximum reasonable values")
    void salesTransactionTotalCalculation_maximumReasonableValues(
            @ForAll("maximumQuantities") Integer quantity,
            @ForAll("maximumPrices") BigDecimal price) {
        
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        
        // Mock customer exists
        CustomerDTO customer = new CustomerDTO(customerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        
        // Mock product exists with the generated price
        ProductDTO product = new ProductDTO(productId, "Test Product", "Electronics", 
                                           new BigDecimal("1000.00"), price);
        when(productClient.getProductById(productId)).thenReturn(product);
        
        // Mock repository save
        when(salesRepository.save(any(SalesTransaction.class))).thenAnswer(invocation -> {
            SalesTransaction transaction = invocation.getArgument(0);
            transaction.setId(1L);
            return transaction;
        });

        // Act
        SalesTransaction result = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        BigDecimal expectedTotal = price.multiply(new BigDecimal(quantity));
        assertEquals(expectedTotal, result.getTotalAmount(),
                    "Total amount should equal quantity (" + quantity + ") × price (" + price + ")");
    }

    /**
     * Property test for null price handling
     */
    @Property
    @Label("Sales transaction total calculation rejects null price")
    void salesTransactionTotalCalculation_rejectsNullPrice(
            @ForAll @Positive Integer quantity) {
        
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        
        // Mock customer exists
        CustomerDTO customer = new CustomerDTO(customerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        
        // Mock product exists with null price
        ProductDTO product = new ProductDTO(productId, "Test Product", "Electronics", 
                                           new BigDecimal("100.00"), null);
        when(productClient.getProductById(productId)).thenReturn(product);

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertEquals("Product price is required for calculation", exception.getMessage(),
                    "Should reject transactions when product price is null");
    }

    /**
     * Property test for decimal precision preservation
     */
    @Property
    @Label("Sales transaction total calculation preserves decimal precision")
    void salesTransactionTotalCalculation_preservesDecimalPrecision(
            @ForAll("precisionQuantities") Integer quantity,
            @ForAll("precisionPrices") BigDecimal price) {
        
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        
        // Mock customer exists
        CustomerDTO customer = new CustomerDTO(customerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        
        // Mock product exists with precise price
        ProductDTO product = new ProductDTO(productId, "Test Product", "Electronics", 
                                           new BigDecimal("100.00"), price);
        when(productClient.getProductById(productId)).thenReturn(product);
        
        // Mock repository save
        when(salesRepository.save(any(SalesTransaction.class))).thenAnswer(invocation -> {
            SalesTransaction transaction = invocation.getArgument(0);
            transaction.setId(1L);
            return transaction;
        });

        // Act
        SalesTransaction result = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        BigDecimal expectedTotal = price.multiply(new BigDecimal(quantity));
        assertEquals(expectedTotal, result.getTotalAmount(),
                    "Total amount should preserve decimal precision: quantity (" + quantity + ") × price (" + price + ")");
        
        // Verify the result has appropriate scale (should not exceed reasonable precision)
        assertEquals(expectedTotal.scale(), result.getTotalAmount().scale(),
                    "Decimal scale should be preserved in calculation");
    }

    // Arbitraries (Generators)

    @Provide
    Arbitrary<Integer> minimumQuantities() {
        return Arbitraries.integers().between(1, 5);
    }

    @Provide
    Arbitrary<BigDecimal> minimumPrices() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.valueOf(0.01), BigDecimal.valueOf(1.00))
            .ofScale(2);
    }

    @Provide
    Arbitrary<Integer> maximumQuantities() {
        return Arbitraries.integers().between(1000, 10000);
    }

    @Provide
    Arbitrary<BigDecimal> maximumPrices() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.valueOf(5000.00), BigDecimal.valueOf(50000.00))
            .ofScale(2);
    }

    @Provide
    Arbitrary<Integer> precisionQuantities() {
        return Arbitraries.integers().between(1, 100);
    }

    @Provide
    Arbitrary<BigDecimal> precisionPrices() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.valueOf(0.01), BigDecimal.valueOf(999.99))
            .ofScale(2);
    }
}