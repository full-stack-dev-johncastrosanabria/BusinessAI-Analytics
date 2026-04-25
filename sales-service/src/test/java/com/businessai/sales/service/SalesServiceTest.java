package com.businessai.sales.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.businessai.sales.client.CustomerClient;
import com.businessai.sales.client.ProductClient;
import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.entity.SalesTransaction;
import com.businessai.sales.exception.CustomerServiceException;
import com.businessai.sales.exception.ProductServiceException;
import com.businessai.sales.exception.SalesValidationException;
import com.businessai.sales.repository.SalesRepository;

/**
 * Unit tests for SalesService.
 */
@ExtendWith(MockitoExtension.class)
class SalesServiceTest {

    @Mock
    private SalesRepository salesRepository;

    @Mock
    private CustomerClient customerClient;

    @Mock
    private ProductClient productClient;

    private SalesService salesService;

    @BeforeEach
    void setUp() {
        salesService = new SalesService(salesRepository, customerClient, productClient);
    }

    @Test
    void createTransaction_Success() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;
        BigDecimal productPrice = new BigDecimal("100.00");
        BigDecimal expectedTotal = new BigDecimal("300.00");

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("80.00"), productPrice);

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);
        
        SalesTransaction savedTransaction = new SalesTransaction(customerId, productId, transactionDate, quantity, expectedTotal);
        savedTransaction.setId(1L);
        when(salesRepository.save(any(SalesTransaction.class))).thenReturn(savedTransaction);

        // Act
        SalesTransaction result = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        assertNotNull(result);
        assertEquals(customerId, result.getCustomerId());
        assertEquals(productId, result.getProductId());
        assertEquals(transactionDate, result.getTransactionDate());
        assertEquals(quantity, result.getQuantity());
        assertEquals(expectedTotal, result.getTotalAmount());
        
        verify(customerClient).getCustomerById(customerId);
        verify(productClient).getProductById(productId);
        verify(salesRepository).save(any(SalesTransaction.class));
    }

    @Test
    void createTransaction_CalculatesTotalCorrectly() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 5;
        BigDecimal productPrice = new BigDecimal("49.99");
        BigDecimal expectedTotal = new BigDecimal("249.95"); // 5 × 49.99

        CustomerDTO customer = new CustomerDTO(customerId, "Jane Smith", "jane@example.com", "SMB", "Canada");
        ProductDTO product = new ProductDTO(productId, "Mouse", "Electronics", new BigDecimal("20.00"), productPrice);

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);
        
        SalesTransaction savedTransaction = new SalesTransaction(customerId, productId, transactionDate, quantity, expectedTotal);
        when(salesRepository.save(any(SalesTransaction.class))).thenReturn(savedTransaction);

        // Act
        SalesTransaction result = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        assertEquals(expectedTotal, result.getTotalAmount());
    }

    @Test
    void createTransaction_NullCustomerId_ThrowsException() {
        // Arrange
        Long customerId = null;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Customer ID is required"));
    }

    @Test
    void createTransaction_NullProductId_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        Long productId = null;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Product ID is required"));
    }

    @Test
    void createTransaction_NullTransactionDate_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = null;
        Integer quantity = 3;

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Transaction date is required"));
    }

    @Test
    void createTransaction_NullQuantity_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = null;

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Quantity must be at least 1"));
    }

    @Test
    void createTransaction_ZeroQuantity_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 0;

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Quantity must be at least 1"));
    }

    @Test
    void createTransaction_NegativeQuantity_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = -5;

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Quantity must be at least 1"));
    }

    @Test
    void createTransaction_CustomerNotFound_ThrowsException() {
        // Arrange
        Long customerId = 999L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;

        when(customerClient.getCustomerById(customerId))
            .thenThrow(new CustomerServiceException("Customer not found with ID: " + customerId));

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Customer validation failed"));
    }

    @Test
    void createTransaction_ProductNotFound_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        Long productId = 999L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId))
            .thenThrow(new ProductServiceException("Product not found with ID: " + productId));

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );
        
        assertTrue(exception.getMessage().contains("Product validation failed"));
    }

    @Test
    void getTransactionById_Success() {
        // Arrange
        Long transactionId = 1L;
        SalesTransaction transaction = new SalesTransaction(1L, 2L, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"));
        transaction.setId(transactionId);

        when(salesRepository.findById(transactionId)).thenReturn(Optional.of(transaction));

        // Act
        SalesTransaction result = salesService.getTransactionById(transactionId);

        // Assert
        assertNotNull(result);
        assertEquals(transactionId, result.getId());
        verify(salesRepository).findById(transactionId);
    }

    @Test
    void getTransactionById_NotFound_ThrowsException() {
        // Arrange
        Long transactionId = 999L;
        when(salesRepository.findById(transactionId)).thenReturn(Optional.empty());

        // Act & Assert
        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.getTransactionById(transactionId)
        );
        
        assertTrue(exception.getMessage().contains("Sales transaction not found with ID: " + transactionId));
    }

    @Test
    void getTransactions_NoFilters_ReturnsAll() {
        // Arrange
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(1L, 2L, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00")),
            new SalesTransaction(2L, 3L, LocalDate.of(2024, 1, 16), 2, new BigDecimal("200.00"))
        );
        when(salesRepository.findAllOrderByDateDesc()).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, null, null);

        // Assert
        assertEquals(2, result.size());
        verify(salesRepository).findAllOrderByDateDesc();
    }

    @Test
    void getTransactions_FilterByDateRange() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(1L, 2L, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByTransactionDateBetween(startDate, endDate)).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(startDate, endDate, null, null);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByTransactionDateBetween(startDate, endDate);
    }

    @Test
    void getTransactions_FilterByCustomerId() {
        // Arrange
        Long customerId = 1L;
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(customerId, 2L, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByCustomerId(customerId)).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, customerId, null);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByCustomerId(customerId);
    }

    @Test
    void getTransactions_FilterByProductId() {
        // Arrange
        Long productId = 2L;
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(1L, productId, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByProductId(productId)).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, null, productId);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByProductId(productId);
    }

    @Test
    void getTransactions_FilterByDateRangeAndCustomerId() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        Long customerId = 1L;
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(customerId, 2L, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByCustomerIdAndDateBetween(customerId, startDate, endDate)).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(startDate, endDate, customerId, null);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByCustomerIdAndDateBetween(customerId, startDate, endDate);
    }

    @Test
    void getTransactions_FilterByDateRangeAndProductId() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        Long productId = 2L;
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(1L, productId, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByProductIdAndDateBetween(productId, startDate, endDate)).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(startDate, endDate, null, productId);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByProductIdAndDateBetween(productId, startDate, endDate);
    }

    @Test
    void getTransactions_FilterByCustomerIdAndProductId() {
        // Arrange
        Long customerId = 1L;
        Long productId = 2L;
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(customerId, productId, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByCustomerIdAndProductId(customerId, productId)).thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(null, null, customerId, productId);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByCustomerIdAndProductId(customerId, productId);
    }

    @Test
    void getTransactions_FilterByAllParameters() {
        // Arrange
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        Long customerId = 1L;
        Long productId = 2L;
        List<SalesTransaction> transactions = Arrays.asList(
            new SalesTransaction(customerId, productId, LocalDate.of(2024, 1, 15), 3, new BigDecimal("300.00"))
        );
        when(salesRepository.findByCustomerIdAndProductIdAndDateBetween(customerId, productId, startDate, endDate))
            .thenReturn(transactions);

        // Act
        List<SalesTransaction> result = salesService.getTransactions(startDate, endDate, customerId, productId);

        // Assert
        assertEquals(1, result.size());
        verify(salesRepository).findByCustomerIdAndProductIdAndDateBetween(customerId, productId, startDate, endDate);
    }
}
