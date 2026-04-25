package com.businessai.gateway.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.test.StepVerifier;

/**
 * Unit tests for GlobalErrorWebExceptionHandler.
 * 
 * Tests verify that:
 * - Different exception types map to correct HTTP status codes
 * - Error responses have correct content type
 * - Handler processes exceptions without errors
 * 
 * Note: Full response body verification is done in integration tests
 * due to limitations of MockServerWebExchange.
 */
class GlobalErrorWebExceptionHandlerTest {

    private GlobalErrorWebExceptionHandler errorHandler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        errorHandler = new GlobalErrorWebExceptionHandler(objectMapper);
    }

    @Test
    void testHandleResponseStatusException() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, "/api/products/999")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        ResponseStatusException exception = new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Product not found");

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.NOT_FOUND.value(), statusCode.value());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void testHandleValidationException() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.POST, "/api/customers")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        IllegalArgumentException exception = new IllegalArgumentException("Invalid email format");

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.BAD_REQUEST.value(), statusCode.value());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void testHandleGenericException() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.POST, "/api/sales")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        RuntimeException exception = new RuntimeException("Unexpected error");

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), statusCode.value());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void testHandleForbiddenException() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.DELETE, "/api/documents/123")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        ResponseStatusException exception = new ResponseStatusException(
            HttpStatus.FORBIDDEN, "Access denied");

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.FORBIDDEN.value(), statusCode.value());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void testHandleServerError() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, "/api/products")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        Exception exception = new Exception("Internal error");

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertTrue(statusCode.is5xxServerError());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void testErrorResponseAlwaysReturnsJson() {
        // Test that all error responses have JSON content type
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, "/api/test")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        Exception exception = new RuntimeException("Test");

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }
}
