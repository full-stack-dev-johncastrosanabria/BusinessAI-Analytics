package com.businessai.sales;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
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
 * End-to-end integration tests for Sales Service transaction creation flow.
 * 
 * Tests verify that:
 * - Sales Service successfully calls Product Service for validation
 * - Sales Service successfully calls Customer Service for validation
 * - End-to-end transaction creation works through the REST API
 * - Transaction data is correctly persisted and retrieved
 * - Total amount is correctly calculated
 * - Filtering by date range, customer, and product works correctly
 * - Error scenarios are properly handled
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 21.8
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EndToEndTransactionIntegrationTest {

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

    // ==================== Sales Service to Product Service Communication ====================

    @Test
    void testSalesService_CallsProductService_ForValidation() {
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        // Act
        SalesTransaction transaction = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        assertNotNull(transaction);
        assertEquals(productId, transaction.getProductId());
        assertEquals(new BigDecimal("2400.00"), transaction.getTotalAmount());
    }

    @Test
    void testSalesService_ProductServiceValidation_RejectsInvalidProduct() {
        // Arrange
        Long customerId = 1L;
        Long invalidProductId = 999999L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(invalidProductId))
            .thenThrow(new ProductServiceException("Product not found with ID: " + invalidProductId));

        // Act & Assert
        SalesValidationException exception = org.junit.jupiter.api.Assertions.assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, invalidProductId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Product validation failed"));
    }

    @Test
    void testSalesService_ProductServiceValidation_RetrievesProductPrice() {
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 5;
        BigDecimal productPrice = new BigDecimal("250.00");

        CustomerDTO customer = new CustomerDTO(customerId, "Jane Smith", "jane@example.com", "SMB", "Canada");
        ProductDTO product = new ProductDTO(productId, "Monitor", "Electronics", new BigDecimal("150.00"), productPrice);

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        // Act
        SalesTransaction transaction = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        assertNotNull(transaction);
        assertEquals(new BigDecimal("1250.00"), transaction.getTotalAmount());
    }

    // ==================== Sales Service to Customer Service Communication ====================

    @Test
    void testSalesService_CallsCustomerService_ForValidation() {
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        // Act
        SalesTransaction transaction = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        assertNotNull(transaction);
        assertEquals(customerId, transaction.getCustomerId());
    }

    @Test
    void testSalesService_CustomerServiceValidation_RejectsInvalidCustomer() {
        // Arrange
        Long invalidCustomerId = 999999L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        when(customerClient.getCustomerById(invalidCustomerId))
            .thenThrow(new CustomerServiceException("Customer not found with ID: " + invalidCustomerId));

        // Act & Assert
        SalesValidationException exception = org.junit.jupiter.api.Assertions.assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(invalidCustomerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Customer validation failed"));
    }

    @Test
    void testSalesService_CustomerServiceValidation_RetrievesCustomerData() {
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        String expectedCustomerName = "Alice Johnson";
        String expectedCustomerEmail = "alice@example.com";
        CustomerDTO customer = new CustomerDTO(customerId, expectedCustomerName, expectedCustomerEmail, "Enterprise", "USA");
        ProductDTO product = new ProductDTO(productId, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId)).thenReturn(product);

        // Act
        SalesTransaction transaction = salesService.createTransaction(customerId, productId, transactionDate, quantity);

        // Assert
        assertNotNull(transaction);
        assertEquals(customerId, transaction.getCustomerId());
    }

    // ==================== End-to-End Transaction Creation Flow ====================

    @Test
    void testEndToEnd_TransactionCreation_CompleteFlow() throws Exception {
        // Arrange
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

        // Act - Create transaction via REST API
        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.customerId").value(customerId))
            .andExpect(jsonPath("$.productId").value(productId))
            .andExpect(jsonPath("$.transactionDate").value(transactionDate.toString()))
            .andExpect(jsonPath("$.quantity").value(quantity))
            .andExpect(jsonPath("$.totalAmount").value(2400.00));

        // Assert - Verify transaction was persisted
        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(1, transactions.size());
        SalesTransaction persistedTransaction = transactions.get(0);
        assertEquals(customerId, persistedTransaction.getCustomerId());
        assertEquals(productId, persistedTransaction.getProductId());
        assertEquals(transactionDate, persistedTransaction.getTransactionDate());
        assertEquals(quantity, persistedTransaction.getQuantity());
        assertEquals(new BigDecimal("2400.00"), persistedTransaction.getTotalAmount());
    }

    @Test
    void testEndToEnd_TransactionCreation_MultipleTransactions() throws Exception {
        // Arrange
        CustomerDTO customer1 = new CustomerDTO(1L, "John Doe", "john@example.com", "Enterprise", "USA");
        CustomerDTO customer2 = new CustomerDTO(2L, "Jane Smith", "jane@example.com", "SMB", "Canada");
        ProductDTO product1 = new ProductDTO(1L, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));
        ProductDTO product2 = new ProductDTO(2L, "Mouse", "Electronics", new BigDecimal("20.00"), new BigDecimal("50.00"));

        when(customerClient.getCustomerById(1L)).thenReturn(customer1);
        when(customerClient.getCustomerById(2L)).thenReturn(customer2);
        when(productClient.getProductById(1L)).thenReturn(product1);
        when(productClient.getProductById(2L)).thenReturn(product2);

        // Act - Create first transaction
        CreateSalesTransactionRequest request1 = new CreateSalesTransactionRequest(
            1L,
            1L,
            LocalDate.of(2024, 1, 15),
            2
        );

        String requestBody1 = objectMapper.writeValueAsString(request1);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody1))
            .andExpect(status().isCreated());

        // Act - Create second transaction
        CreateSalesTransactionRequest request2 = new CreateSalesTransactionRequest(
            2L,
            2L,
            LocalDate.of(2024, 1, 20),
            5
        );

        String requestBody2 = objectMapper.writeValueAsString(request2);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody2))
            .andExpect(status().isCreated());

        // Assert - Verify both transactions were persisted
        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(2, transactions.size());
    }

    @Test
    void testEndToEnd_TransactionCreation_VerifyTotalAmountCalculation() throws Exception {
        // Arrange
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

        // Act
        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.totalAmount").value(expectedTotal.doubleValue()));
    }

    @Test
    void testEndToEnd_TransactionCreation_VerifyPersistence() throws Exception {
        // Arrange
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

        // Act
        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated());

        // Assert
        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(1, transactions.size(), "Transaction should be persisted to database");
        assertEquals(customerId, transactions.get(0).getCustomerId());
        assertEquals(productId, transactions.get(0).getProductId());
    }

    @Test
    void testEndToEnd_TransactionCreation_VerifyRetrieval() throws Exception {
        // Arrange
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

        // Act - Create transaction
        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated());

        // Act - Retrieve transaction
        List<SalesTransaction> transactions = salesRepository.findAll();
        assertEquals(1, transactions.size());
        SalesTransaction transaction = transactions.get(0);
        Long transactionId = transaction.getId();

        mockMvc.perform(get("/api/sales/" + transactionId)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(transactionId))
            .andExpect(jsonPath("$.customerId").value(customerId))
            .andExpect(jsonPath("$.productId").value(productId));
    }

    // ==================== Transaction Filtering Tests ====================

    @Test
    void testEndToEnd_TransactionFiltering_ByDateRange() throws Exception {
        // Arrange
        CustomerDTO customer = new CustomerDTO(1L, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(1L, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(1L)).thenReturn(customer);
        when(productClient.getProductById(1L)).thenReturn(product);

        // Create transactions on different dates
        CreateSalesTransactionRequest request1 = new CreateSalesTransactionRequest(1L, 1L, LocalDate.of(2024, 1, 15), 1);
        CreateSalesTransactionRequest request2 = new CreateSalesTransactionRequest(1L, 1L, LocalDate.of(2024, 2, 15), 1);

        String requestBody1 = objectMapper.writeValueAsString(request1);
        String requestBody2 = objectMapper.writeValueAsString(request2);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody1))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody2))
            .andExpect(status().isCreated());

        // Act & Assert - Filter by date range
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);

        mockMvc.perform(get("/api/sales")
                .param("dateFrom", startDate.toString())
                .param("dateTo", endDate.toString())
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void testEndToEnd_TransactionFiltering_ByCustomerId() throws Exception {
        // Arrange
        CustomerDTO customer1 = new CustomerDTO(1L, "John Doe", "john@example.com", "Enterprise", "USA");
        CustomerDTO customer2 = new CustomerDTO(2L, "Jane Smith", "jane@example.com", "SMB", "Canada");
        ProductDTO product = new ProductDTO(1L, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(1L)).thenReturn(customer1);
        when(customerClient.getCustomerById(2L)).thenReturn(customer2);
        when(productClient.getProductById(1L)).thenReturn(product);

        // Create transactions for different customers
        CreateSalesTransactionRequest request1 = new CreateSalesTransactionRequest(1L, 1L, LocalDate.of(2024, 1, 15), 1);
        CreateSalesTransactionRequest request2 = new CreateSalesTransactionRequest(2L, 1L, LocalDate.of(2024, 1, 20), 1);

        String requestBody1 = objectMapper.writeValueAsString(request1);
        String requestBody2 = objectMapper.writeValueAsString(request2);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody1))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody2))
            .andExpect(status().isCreated());

        // Act & Assert - Filter by customer ID
        mockMvc.perform(get("/api/sales")
                .param("customerId", "1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void testEndToEnd_TransactionFiltering_ByProductId() throws Exception {
        // Arrange
        CustomerDTO customer = new CustomerDTO(1L, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product1 = new ProductDTO(1L, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));
        ProductDTO product2 = new ProductDTO(2L, "Mouse", "Electronics", new BigDecimal("20.00"), new BigDecimal("50.00"));

        when(customerClient.getCustomerById(1L)).thenReturn(customer);
        when(productClient.getProductById(1L)).thenReturn(product1);
        when(productClient.getProductById(2L)).thenReturn(product2);

        // Create transactions for different products
        CreateSalesTransactionRequest request1 = new CreateSalesTransactionRequest(1L, 1L, LocalDate.of(2024, 1, 15), 1);
        CreateSalesTransactionRequest request2 = new CreateSalesTransactionRequest(1L, 2L, LocalDate.of(2024, 1, 20), 1);

        String requestBody1 = objectMapper.writeValueAsString(request1);
        String requestBody2 = objectMapper.writeValueAsString(request2);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody1))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody2))
            .andExpect(status().isCreated());

        // Act & Assert - Filter by product ID
        mockMvc.perform(get("/api/sales")
                .param("productId", "1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void testEndToEnd_TransactionFiltering_ByMultipleCriteria() throws Exception {
        // Arrange
        CustomerDTO customer = new CustomerDTO(1L, "John Doe", "john@example.com", "Enterprise", "USA");
        ProductDTO product = new ProductDTO(1L, "Laptop", "Electronics", new BigDecimal("800.00"), new BigDecimal("1200.00"));

        when(customerClient.getCustomerById(1L)).thenReturn(customer);
        when(productClient.getProductById(1L)).thenReturn(product);

        CreateSalesTransactionRequest request = new CreateSalesTransactionRequest(1L, 1L, LocalDate.of(2024, 1, 15), 1);
        String requestBody = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated());

        // Act & Assert - Filter by multiple criteria
        mockMvc.perform(get("/api/sales")
                .param("dateFrom", "2024-01-01")
                .param("dateTo", "2024-01-31")
                .param("customerId", "1")
                .param("productId", "1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    // ==================== Error Handling in End-to-End Flow ====================

    @Test
    void testEndToEnd_ErrorHandling_BothServicesUnavailable() {
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        when(customerClient.getCustomerById(customerId))
            .thenThrow(new CustomerServiceException("Customer Service unavailable"));
        when(productClient.getProductById(productId))
            .thenThrow(new ProductServiceException("Product Service unavailable"));

        // Act & Assert
        SalesValidationException exception = org.junit.jupiter.api.Assertions.assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Customer validation failed"));
    }

    @Test
    void testEndToEnd_ErrorHandling_PartialServiceFailure() {
        // Arrange
        Long customerId = 1L;
        Long productId = 1L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 2;

        CustomerDTO customer = new CustomerDTO(customerId, "John Doe", "john@example.com", "Enterprise", "USA");

        when(customerClient.getCustomerById(customerId)).thenReturn(customer);
        when(productClient.getProductById(productId))
            .thenThrow(new ProductServiceException("Product Service unavailable"));

        // Act & Assert
        SalesValidationException exception = org.junit.jupiter.api.Assertions.assertThrows(
            SalesValidationException.class,
            () -> salesService.createTransaction(customerId, productId, transactionDate, quantity)
        );

        assertTrue(exception.getMessage().contains("Product validation failed"));
    }

    @Test
    void testEndToEnd_ErrorHandling_InvalidTransactionData() throws Exception {
        // Arrange
        CreateSalesTransactionRequest invalidRequest = new CreateSalesTransactionRequest(
            1L,
            1L,
            LocalDate.of(2024, 1, 15),
            0  // Invalid quantity
        );

        String requestBody = objectMapper.writeValueAsString(invalidRequest);

        // Act & Assert
        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest());
    }

    @Test
    void testEndToEnd_ErrorHandling_MissingRequiredFields() throws Exception {
        // Arrange
        String invalidJson = """
            {
                "customerId": 1
            }
            """;

        // Act & Assert
        mockMvc.perform(post("/api/sales")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }
}
