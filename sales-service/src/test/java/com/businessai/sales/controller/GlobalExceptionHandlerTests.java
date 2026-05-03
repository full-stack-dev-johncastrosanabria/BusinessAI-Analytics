package com.businessai.sales.controller;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import com.businessai.sales.controller.GlobalExceptionHandler.ErrorResponse;
import com.businessai.sales.exception.CustomerServiceException;
import com.businessai.sales.exception.ProductServiceException;
import com.businessai.sales.exception.SalesValidationException;

/**
 * Unit tests for GlobalExceptionHandler.
 * Tests exception handling for various exception types and verifies
 * error response structure, HTTP status codes, and logging behavior.
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTests {

    private GlobalExceptionHandler exceptionHandler;
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        webRequest = mock(WebRequest.class, org.mockito.Mockito.withSettings().lenient());
        when(webRequest.getDescription(false)).thenReturn("uri=/api/sales");
    }

    // CustomerServiceException Tests

    @Test
    void testHandleCustomerServiceException_ReturnsCorrectStatus() {
        CustomerServiceException exception = new CustomerServiceException("Customer not found");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleCustomerServiceException(exception, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testHandleCustomerServiceException_ReturnsCorrectErrorMessage() {
        String errorMessage = "Customer not found with ID: 123";
        CustomerServiceException exception = new CustomerServiceException(errorMessage);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleCustomerServiceException(exception, webRequest);

        assertNotNull(response.getBody());
        assertEquals(errorMessage, response.getBody().getMessage());
    }

    @Test
    void testHandleCustomerServiceException_ReturnsCorrectErrorResponseStructure() {
        CustomerServiceException exception = new CustomerServiceException("Customer service error");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleCustomerServiceException(exception, webRequest);

        assertNotNull(response.getBody());
        ErrorResponse errorResponse = response.getBody();
        assertNotNull(errorResponse.getTimestamp());
        assertEquals(400, errorResponse.getStatus());
        assertEquals("Bad Request", errorResponse.getError());
        assertEquals("Customer service error", errorResponse.getMessage());
        assertNull(errorResponse.getDetails());
        assertEquals("/api/sales", errorResponse.getPath());
    }

    @Test
    void testHandleCustomerServiceException_TimestampIsRecent() {
        CustomerServiceException exception = new CustomerServiceException("Customer error");
        LocalDateTime before = LocalDateTime.now().minusSeconds(1);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleCustomerServiceException(exception, webRequest);

        LocalDateTime after = LocalDateTime.now().plusSeconds(1);
        assertNotNull(response.getBody());
        LocalDateTime timestamp = response.getBody().getTimestamp();
        assertTrue(timestamp.isAfter(before) && timestamp.isBefore(after));
    }

    // ProductServiceException Tests

    @Test
    void testHandleProductServiceException_ReturnsCorrectStatus() {
        ProductServiceException exception = new ProductServiceException("Product not found");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductServiceException(exception, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testHandleProductServiceException_ReturnsCorrectErrorMessage() {
        String errorMessage = "Product not found with ID: 456";
        ProductServiceException exception = new ProductServiceException(errorMessage);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductServiceException(exception, webRequest);

        assertNotNull(response.getBody());
        assertEquals(errorMessage, response.getBody().getMessage());
    }

    @Test
    void testHandleProductServiceException_ReturnsCorrectErrorResponseStructure() {
        ProductServiceException exception = new ProductServiceException("Product service error");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductServiceException(exception, webRequest);

        assertNotNull(response.getBody());
        ErrorResponse errorResponse = response.getBody();
        assertNotNull(errorResponse.getTimestamp());
        assertEquals(400, errorResponse.getStatus());
        assertEquals("Bad Request", errorResponse.getError());
        assertEquals("Product service error", errorResponse.getMessage());
        assertNull(errorResponse.getDetails());
        assertEquals("/api/sales", errorResponse.getPath());
    }

    @Test
    void testHandleProductServiceException_PathExtraction() {
        when(webRequest.getDescription(false)).thenReturn("uri=/api/sales/123");
        ProductServiceException exception = new ProductServiceException("Product error");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductServiceException(exception, webRequest);

        assertNotNull(response.getBody());
        assertEquals("/api/sales/123", response.getBody().getPath());
    }

    // SalesValidationException Tests

    @Test
    void testHandleSalesValidationException_ReturnsCorrectStatus() {
        SalesValidationException exception = new SalesValidationException("Validation failed");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleSalesValidationException(exception, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testHandleSalesValidationException_ReturnsCorrectErrorMessage() {
        String errorMessage = "Quantity must be at least 1";
        SalesValidationException exception = new SalesValidationException(errorMessage);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleSalesValidationException(exception, webRequest);

        assertNotNull(response.getBody());
        assertEquals(errorMessage, response.getBody().getMessage());
    }

    @Test
    void testHandleSalesValidationException_ReturnsCorrectErrorResponseStructure() {
        SalesValidationException exception = new SalesValidationException("Invalid transaction data");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleSalesValidationException(exception, webRequest);

        assertNotNull(response.getBody());
        ErrorResponse errorResponse = response.getBody();
        assertNotNull(errorResponse.getTimestamp());
        assertEquals(400, errorResponse.getStatus());
        assertEquals("Bad Request", errorResponse.getError());
        assertEquals("Invalid transaction data", errorResponse.getMessage());
        assertNull(errorResponse.getDetails());
        assertEquals("/api/sales", errorResponse.getPath());
    }

    // MethodArgumentNotValidException Tests

    @Test
    void testHandleValidationException_ReturnsCorrectStatus() {
        MethodArgumentNotValidException exception = createMethodArgumentNotValidException();

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, webRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testHandleValidationException_ReturnsFieldErrors() {
        MethodArgumentNotValidException exception = createMethodArgumentNotValidException();

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, webRequest);

        assertNotNull(response.getBody());
        Map<String, String> details = response.getBody().getDetails();
        assertNotNull(details);
        assertTrue(details.containsKey("quantity"));
        assertEquals("must be greater than 0", details.get("quantity"));
    }

    @Test
    void testHandleValidationException_ReturnsCorrectErrorMessage() {
        MethodArgumentNotValidException exception = createMethodArgumentNotValidException();

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, webRequest);

        assertNotNull(response.getBody());
        assertEquals("Validation failed for sales transaction", response.getBody().getMessage());
    }

    @Test
    void testHandleValidationException_ReturnsCorrectErrorResponseStructure() {
        MethodArgumentNotValidException exception = createMethodArgumentNotValidException();

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, webRequest);

        assertNotNull(response.getBody());
        ErrorResponse errorResponse = response.getBody();
        assertNotNull(errorResponse.getTimestamp());
        assertEquals(400, errorResponse.getStatus());
        assertEquals("Bad Request", errorResponse.getError());
        assertEquals("Validation failed for sales transaction", errorResponse.getMessage());
        assertNotNull(errorResponse.getDetails());
        assertEquals("/api/sales", errorResponse.getPath());
    }

    @Test
    void testHandleValidationException_MultipleFieldErrors() {
        MethodArgumentNotValidException exception = createMethodArgumentNotValidExceptionWithMultipleErrors();

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, webRequest);

        assertNotNull(response.getBody());
        Map<String, String> details = response.getBody().getDetails();
        assertNotNull(details);
        assertEquals(2, details.size());
        assertTrue(details.containsKey("quantity"));
        assertTrue(details.containsKey("customerId"));
    }

    // Generic Exception Tests

    @Test
    void testHandleGlobalException_ReturnsCorrectStatus() {
        Exception exception = new RuntimeException("Unexpected error");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, webRequest);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testHandleGlobalException_ReturnsGenericErrorMessage() {
        Exception exception = new RuntimeException("Database connection failed");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, webRequest);

        assertNotNull(response.getBody());
        assertEquals("An unexpected error occurred", response.getBody().getMessage());
    }

    @Test
    void testHandleGlobalException_ReturnsCorrectErrorResponseStructure() {
        Exception exception = new NullPointerException("Null pointer");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, webRequest);

        assertNotNull(response.getBody());
        ErrorResponse errorResponse = response.getBody();
        assertNotNull(errorResponse.getTimestamp());
        assertEquals(500, errorResponse.getStatus());
        assertEquals("Internal Server Error", errorResponse.getError());
        assertEquals("An unexpected error occurred", errorResponse.getMessage());
        assertNull(errorResponse.getDetails());
        assertEquals("/api/sales", errorResponse.getPath());
    }

    @Test
    void testHandleGlobalException_LogsException() {
        Exception exception = new RuntimeException("Test exception for logging");

        // This test verifies the method executes without throwing an exception
        // Actual logging verification would require a logging framework mock
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, webRequest);

        assertNotNull(response);
        assertNotNull(response.getBody());
    }

    // ErrorResponse Tests

    @Test
    void testErrorResponse_AllFieldsAccessible() {
        LocalDateTime timestamp = LocalDateTime.now();
        Map<String, String> details = Map.of("field", "error");
        
        ErrorResponse errorResponse = new ErrorResponse(
            timestamp,
            400,
            "Bad Request",
            "Test message",
            details,
            "/api/test"
        );

        assertEquals(timestamp, errorResponse.getTimestamp());
        assertEquals(400, errorResponse.getStatus());
        assertEquals("Bad Request", errorResponse.getError());
        assertEquals("Test message", errorResponse.getMessage());
        assertEquals(details, errorResponse.getDetails());
        assertEquals("/api/test", errorResponse.getPath());
    }

    @Test
    void testErrorResponse_WithNullDetails() {
        ErrorResponse errorResponse = new ErrorResponse(
            LocalDateTime.now(),
            404,
            "Not Found",
            "Resource not found",
            null,
            "/api/resource"
        );

        assertNull(errorResponse.getDetails());
    }

    // Helper Methods

    private MethodArgumentNotValidException createMethodArgumentNotValidException() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("salesTransaction", "quantity", "must be greater than 0");
        when(bindingResult.getAllErrors()).thenReturn(java.util.List.of(fieldError));

        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        when(exception.getBindingResult()).thenReturn(bindingResult);

        return exception;
    }

    private MethodArgumentNotValidException createMethodArgumentNotValidExceptionWithMultipleErrors() {
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError1 = new FieldError("salesTransaction", "quantity", "must be greater than 0");
        FieldError fieldError2 = new FieldError("salesTransaction", "customerId", "must not be null");
        when(bindingResult.getAllErrors()).thenReturn(java.util.List.of(fieldError1, fieldError2));

        MethodArgumentNotValidException exception = mock(MethodArgumentNotValidException.class);
        when(exception.getBindingResult()).thenReturn(bindingResult);

        return exception;
    }
}
