package com.businessai.sales.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.businessai.sales.client.CustomerClient;
import com.businessai.sales.client.ProductClient;
import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.exception.CustomerServiceException;
import com.businessai.sales.exception.ProductServiceException;
import com.businessai.sales.exception.SalesValidationException;
import com.businessai.sales.repository.SalesRepository;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.lifecycle.BeforeTry;

/**
 * Property-based tests for Sales Transaction Reference Validation.
 * 
 * **Validates: Requirements 3.2**
 */
class SalesTransactionReferenceValidationProperties {

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
     * Property 5: Sales Transaction Reference Validation
     * 
     * **Validates: Requirements 3.2**
     * 
     * For any sales transaction creation request, the Sales Service SHALL validate
     * that the referenced customer ID and product ID exist in the database before
     * creating the transaction. Transactions with non-existent references SHALL be rejected.
     */
    @Property
    @Label("Sales transaction creation rejects non-existent customer IDs")
    void salesTransactionValidation_rejectsNonExistentCustomerId(
            @ForAll("validCustomerIds") Long invalidCustomerId,
            @ForAll("validProductIds") Long validProductId,
            @ForAll("validTransactionDates") LocalDate transactionDate,
            @ForAll("validQuantities") Integer quantity) {
        
        // Arrange - Mock customer not found
        when(customerClient.getCustomerById(invalidCustomerId))
            .thenThrow(new CustomerServiceException("Customer not found with ID: " + invalidCustomerId));
        
        // Mock product exists (to isolate customer validation)
        ProductDTO product = new ProductDTO(validProductId, "Test Product", "Electronics", 
                                           new BigDecimal("100.00"), new BigDecimal("150.00"));
        when(productClient.getProductById(validProductId)).thenReturn(product);

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(invalidCustomerId, validProductId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Customer validation failed"),
                  "Exception message should indicate customer validation failure");
        verify(customerClient, times(1)).getCustomerById(invalidCustomerId);
        verify(salesRepository, never()).save(any());
    }

    @Property
    @Label("Sales transaction creation rejects non-existent product IDs")
    void salesTransactionValidation_rejectsNonExistentProductId(
            @ForAll("validCustomerIds") Long validCustomerId,
            @ForAll("validProductIds") Long invalidProductId,
            @ForAll("validTransactionDates") LocalDate transactionDate,
            @ForAll("validQuantities") Integer quantity) {
        
        // Arrange - Mock customer exists (to isolate product validation)
        CustomerDTO customer = new CustomerDTO(validCustomerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(validCustomerId)).thenReturn(customer);
        
        // Mock product not found
        when(productClient.getProductById(invalidProductId))
            .thenThrow(new ProductServiceException("Product not found with ID: " + invalidProductId));

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(validCustomerId, invalidProductId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Product validation failed"),
                  "Exception message should indicate product validation failure");
        verify(customerClient, times(1)).getCustomerById(validCustomerId);
        verify(productClient, times(1)).getProductById(invalidProductId);
        verify(salesRepository, never()).save(any());
    }

    @Property
    @Label("Sales transaction creation rejects when both customer and product IDs are non-existent")
    void salesTransactionValidation_rejectsBothNonExistentReferences(
            @ForAll("validCustomerIds") Long invalidCustomerId,
            @ForAll("validProductIds") Long invalidProductId,
            @ForAll("validTransactionDates") LocalDate transactionDate,
            @ForAll("validQuantities") Integer quantity) {
        
        // Arrange - Mock both customer and product not found
        when(customerClient.getCustomerById(invalidCustomerId))
            .thenThrow(new CustomerServiceException("Customer not found with ID: " + invalidCustomerId));
        
        when(productClient.getProductById(invalidProductId))
            .thenThrow(new ProductServiceException("Product not found with ID: " + invalidProductId));

        // Act & Assert
        // Customer validation happens first, so it should fail on customer
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(invalidCustomerId, invalidProductId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Customer validation failed"),
                  "Exception message should indicate customer validation failure (checked first)");
        verify(customerClient, times(1)).getCustomerById(invalidCustomerId);
        // Product validation should not be reached since customer validation fails first
        verify(productClient, never()).getProductById(any());
        verify(salesRepository, never()).save(any());
    }

    @Property
    @Label("Sales transaction creation rejects null customer ID")
    void salesTransactionValidation_rejectsNullCustomerId(
            @ForAll("validProductIds") Long validProductId,
            @ForAll("validTransactionDates") LocalDate transactionDate,
            @ForAll("validQuantities") Integer quantity) {
        
        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(null, validProductId, transactionDate, quantity)
        );
        
        assertEquals("Customer ID is required", exception.getMessage());
        verify(customerClient, never()).getCustomerById(any());
        verify(productClient, never()).getProductById(any());
        verify(salesRepository, never()).save(any());
    }

    @Property
    @Label("Sales transaction creation rejects null product ID")
    void salesTransactionValidation_rejectsNullProductId(
            @ForAll("validCustomerIds") Long validCustomerId,
            @ForAll("validTransactionDates") LocalDate transactionDate,
            @ForAll("validQuantities") Integer quantity) {
        
        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(validCustomerId, null, transactionDate, quantity)
        );
        
        assertEquals("Product ID is required", exception.getMessage());
        verify(customerClient, never()).getCustomerById(any());
        verify(productClient, never()).getProductById(any());
        verify(salesRepository, never()).save(any());
    }

    @Property
    @Label("Sales transaction creation accepts valid customer and product references")
    void salesTransactionValidation_acceptsValidReferences(
            @ForAll("validCustomerIds") Long validCustomerId,
            @ForAll("validProductIds") Long validProductId,
            @ForAll("validTransactionDates") LocalDate transactionDate,
            @ForAll("validQuantities") Integer quantity) {
        
        // Arrange - Mock both customer and product exist
        CustomerDTO customer = new CustomerDTO(validCustomerId, "Test Customer", 
                                              "test@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(validCustomerId)).thenReturn(customer);
        
        ProductDTO product = new ProductDTO(validProductId, "Test Product", "Electronics", 
                                           new BigDecimal("100.00"), new BigDecimal("150.00"));
        when(productClient.getProductById(validProductId)).thenReturn(product);
        
        // Mock repository save
        when(salesRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        assertDoesNotThrow(
            () -> salesService.createTransaction(validCustomerId, validProductId, transactionDate, quantity)
        );

        // Assert
        verify(customerClient, times(1)).getCustomerById(validCustomerId);
        verify(productClient, times(1)).getProductById(validProductId);
        verify(salesRepository, times(1)).save(any());
    }

    // Arbitraries (Generators)

    @Provide
    Arbitrary<Long> validCustomerIds() {
        return Arbitraries.longs().between(1L, 1000L);
    }

    @Provide
    Arbitrary<Long> validProductIds() {
        return Arbitraries.longs().between(1L, 1000L);
    }

    @Provide
    Arbitrary<LocalDate> validTransactionDates() {
        return Arbitraries.of(
            LocalDate.of(2020, 1, 1),
            LocalDate.of(2021, 6, 15),
            LocalDate.of(2022, 3, 20),
            LocalDate.of(2023, 9, 10),
            LocalDate.of(2024, 12, 31)
        );
    }

    @Provide
    Arbitrary<Integer> validQuantities() {
        return Arbitraries.integers().between(1, 100);
    }
}
