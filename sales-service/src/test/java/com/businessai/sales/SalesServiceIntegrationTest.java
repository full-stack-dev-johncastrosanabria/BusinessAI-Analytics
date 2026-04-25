package com.businessai.sales;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import com.businessai.sales.client.CustomerClient;
import com.businessai.sales.client.ProductClient;
import com.businessai.sales.controller.SalesController.CreateSalesTransactionRequest;
import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.entity.SalesTransaction;
import com.businessai.sales.exception.CustomerServiceException;
import com.businessai.sales.exception.ProductServiceException;
import com.businessai.sales.exception.SalesValidationException;
import com.businessai.sales.repository.SalesRepository;
import com.businessai.sales.service.SalesService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Integration tests for Sales Service.
 * Tests inter-service communication, end-to-end transaction creation flow,
 * and validation error scenarios.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SalesServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SalesService salesService;

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerClient customerClient;

    @MockBean
    private ProductClient productClient;

    @BeforeEach
    void setUp() {
        salesRepository.deleteAll();
    }

    // Inter-Service Communication Tests

    @Test
    void testInterServiceCommunication_CustomerServiceValidation_Success() {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        SalesTransaction transaction = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        assertNotNull(transaction);
        assertEquals(customerId, transaction.getCustomerId());
        assertEquals(productId, transaction.getProductId());
    }

    @Test
    void testInterServiceCommunication_CustomerServiceError() {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        when(customerClient.getCustomerById(customerId))
            .thenThrow(new CustomerServiceException("Customer not found with ID: " + customerId));

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Customer validation failed"));
    }

    @Test
    void testInterServiceCommunication_ProductServiceError() {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId))
            .thenThrow(new ProductServiceException("Product not found with ID: " + productId));

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Product validation failed"));
    }

    // End-to-End Transaction Creation Flow Tests

    @Test
    void testEndToEndTransactionCreation_ViaRestAPI_Success() throws Exception {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(
            customerId,
            productId,
            transactionDate,
            quantity
        );

        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.customerId").value(customerId))
            .andExpect(jsonPath("$.productId").value(productId));
    }

    @Test
    void testEndToEndTransactionCreation_VerifyTotalAmountCalculation() throws Exception {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;
        BigDecimal productPrice = new BigDecimal("100.00");
        BigDecimal expectedTotal = new BigDecimal("300.00");

        CustomerDTO customer = new CustomerDTO(customerId, "Jane Smith", "jane@example.com", "SMB", "Canada");
        ProductDTO product = new ProductDTO(productId, "Mouse", "Electronics", new BigDecimal("20.00"), productPrice);

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(
            customerId,
            productId,
            transactionDate,
            quantity
        );

        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.totalAmount").value(expectedTotal.doubleValue()));
    }

    @Test
    void testEndToEndTransactionCreation_VerifyPersistence() throws Exception {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(
            customerId,
            productId,
            transactionDate,
            quantity
        );

        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated());

        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(1, transactions.size(), "Transaction should be persisted to database");
        assertEquals(customerId, transactions.get(0).getCustomerId());
        assertEquals(productId, transactions.get(0).getProductId());
    }

    @Test
    void testEndToEndTransactionCreation_VerifyRetrieval() throws Exception {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(
            customerId,
            productId,
            transactionDate,
            quantity
        );

        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated());

        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(1, transactions.size());
        SalesTransaction transaction = transactions.get(0);
        assertEquals(customerId, transaction.getCustomerId());
        assertEquals(productId, transaction.getProductId());
        assertEquals(transactionDate, transaction.getTransactionDate());
        assertEquals(quantity, transaction.getQuantity());
    }

    // Validation Error Scenarios Tests

    @Test
    void testValidationError_CustomerDoesNotExist() {
        Long nonExistentCustomerId = 999999L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        when(customerClient.getCustomerById(nonExistentCustomerId))
            .thenThrow(new CustomerServiceException("Customer not found with ID: " + nonExistentCustomerId));

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(nonExistentCustomerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Customer validation failed"));
    }

    @Test
    void testValidationError_ProductDoesNotExist() {
        Long customerId = 1L;
        Long nonExistentProductId = 999999L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(nonExistentProductId))
            .thenThrow(new ProductServiceException("Product not found with ID: " + nonExistentProductId));

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, nonExistentProductId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Product validation failed"));
    }

    @Test
    void testValidationError_InvalidQuantity_Zero() {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer invalidQuantity = 0;

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, invalidQuantity)
        );

        assertTrue(exception.getMessage().contains("Quantity must be at least 1"));
    }

    @Test
    void testValidationError_InvalidQuantity_Negative() {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer invalidQuantity = -5;

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, invalidQuantity)
        );

        assertTrue(exception.getMessage().contains("Quantity must be at least 1"));
    }

    @Test
    void testValidationError_InvalidDate_Null() {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate invalidDate = null;
        Integer quantity = 2;

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, invalidDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Transaction date is required"));
    }

    @Test
    void testValidationError_NullCustomerId() {
        Long nullCustomerId = null;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(nullCustomerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Customer ID is required"));
    }

    @Test
    void testValidationError_NullProductId() {
        Long customerId = 1L;
        Long nullProductId = null;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        SalesValidationException exception = assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, nullProductId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Product ID is required"));
    }

    // REST API Validation Error Tests

    @Test
    void testRestAPI_ValidationError_InvalidQuantity() throws Exception {
        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(
            1L,
            1L,
            LocalDate.of(2024, 1, 15),
            0
        );

        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest());
    }

    @Test
    void testRestAPI_GetTransaction_NotFound() throws Exception {
        // Use a valid ID that doesn't exist in the database
        Long nonExistentTransactionId = 999999L;

        mockMvc.perform(get("/api/sales/" + nonExistentTransactionId)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    void testRestAPI_GetTransaction_Success() throws Exception {
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(
            customerId,
            productId,
            transactionDate,
            quantity
        );

        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated());

        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(1, transactions.size());
        Long transactionId = transactions.get(0).getId();
        mockMvc.perform(get("/api/sales/" + transactionId)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(transactionId));
    }

    @Test
    void testRestAPI_ListTransactions_Success() throws Exception {
        mockMvc.perform(get("/api/sales")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void testRestAPI_ListTransactions_FilterByDateRange() throws Exception {
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);

        mockMvc.perform(get("/api/sales")
                .param("dateFrom", startDate.toString())
                .param("dateTo", endDate.toString())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void testRestAPI_ListTransactions_FilterByCustomerId() throws Exception {
        Long customerId = 1L;

        mockMvc.perform(get("/api/sales")
                .param("customerId", customerId.toString())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void testRestAPI_ListTransactions_FilterByProductId() throws Exception {
        Long productId = 1L;

        mockMvc.perform(get("/api/sales")
                .param("productId", productId.toString())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }
}
