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
 * Validates Requirements: 2.3.6
 *
 * Tests verify:
 * - Error handling for gateway exceptions
 * - Response formatting (JSON error responses)
 * - Status code mapping (404, 500, 503)
 * - Logging of errors
 * - Handling of different exception types (NotFoundException, TimeoutException)
 * - Mock ServerWebExchange and error handling context
 */
class GlobalErrorWebExceptionHandlerTests {

    private GlobalErrorWebExceptionHandler errorHandler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        errorHandler = new GlobalErrorWebExceptionHandler(objectMapper);
    }

    // -------------------------------------------------------------------------
    // Status code mapping tests
    // -------------------------------------------------------------------------

    @Test
    void handle_responseStatusException404_returns404() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products/999")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Product not found");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.NOT_FOUND.value(), statusCode.value());
    }

    @Test
    void handle_responseStatusException500_returns500() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "Internal error");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), statusCode.value());
    }

    @Test
    void handle_responseStatusException503_returns503() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/ai/forecast")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, "Service unavailable");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE.value(), statusCode.value());
    }

    @Test
    void handle_responseStatusException400_returns400() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/customers")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid request body");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.BAD_REQUEST.value(), statusCode.value());
    }

    @Test
    void handle_responseStatusException403_returns403() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.DELETE, "/api/documents/1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Access denied");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.FORBIDDEN.value(), statusCode.value());
    }

    // -------------------------------------------------------------------------
    // Exception type mapping tests (NotFoundException, TimeoutException, etc.)
    // -------------------------------------------------------------------------

    @Test
    void handle_exceptionWithNotFoundInName_returns404() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/customers/42")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Exception whose class name contains "notfound" → should map to 404
        Exception exception = new CustomerNotFoundException("Customer 42 not found");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.NOT_FOUND.value(), statusCode.value());
    }

    @Test
    void handle_exceptionWithTimeoutInName_returns504() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/ai/forecast")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Exception whose class name contains "timeout" → should map to 504
        Exception exception = new GatewayTimeoutException("Downstream service timed out");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.GATEWAY_TIMEOUT.value(), statusCode.value());
    }

    @Test
    void handle_illegalArgumentException_returns400() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        IllegalArgumentException exception = new IllegalArgumentException("Price must be positive");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.BAD_REQUEST.value(), statusCode.value());
    }

    @Test
    void handle_illegalStateException_returns400() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.PUT, "/api/products/1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        IllegalStateException exception = new IllegalStateException("Invalid state transition");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.BAD_REQUEST.value(), statusCode.value());
    }

    @Test
    void handle_exceptionWithConnectionInName_returns502() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics/metrics")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Exception whose class name contains "connection" → should map to 502
        Exception exception = new ServiceConnectionException("Cannot connect to analytics service");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.BAD_GATEWAY.value(), statusCode.value());
    }

    @Test
    void handle_genericRuntimeException_returns500() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/sales")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RuntimeException exception = new RuntimeException("Unexpected error");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), statusCode.value());
    }

    @Test
    void handle_nullPointerException_returns500() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        NullPointerException exception = new NullPointerException("Null reference encountered");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), statusCode.value());
    }

    @Test
    void handle_checkedExceptionGeneric_returns500() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/documents")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        Exception exception = new Exception("Checked exception");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertTrue(statusCode.is5xxServerError());
    }

    // -------------------------------------------------------------------------
    // Response formatting tests (JSON content type)
    // -------------------------------------------------------------------------

    @Test
    void handle_anyException_setsJsonContentType() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/test")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("test")))
                .verifyComplete();

        assertEquals(MediaType.APPLICATION_JSON,
                exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void handle_notFoundException_setsJsonContentType() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products/999")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Not found");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(MediaType.APPLICATION_JSON,
                exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void handle_serverError_setsJsonContentType() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/sales")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Server error")))
                .verifyComplete();

        assertEquals(MediaType.APPLICATION_JSON,
                exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void handle_validationError_setsJsonContentType() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/customers")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new IllegalArgumentException("Invalid email")))
                .verifyComplete();

        assertEquals(MediaType.APPLICATION_JSON,
                exchange.getResponse().getHeaders().getContentType());
    }

    // -------------------------------------------------------------------------
    // Null / edge case handling tests
    // -------------------------------------------------------------------------

    @Test
    void handle_nullExchange_returnsEmptyMono() {
        StepVerifier.create(errorHandler.handle(null, new RuntimeException("test")))
                .verifyComplete();
    }

    @Test
    void handle_nullException_returnsEmptyMono() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, null))
                .verifyComplete();
    }

    @Test
    void handle_bothNullArguments_returnsEmptyMono() {
        StepVerifier.create(errorHandler.handle(null, null))
                .verifyComplete();
    }

    // -------------------------------------------------------------------------
    // Logging tests (verify handler completes without error for all log paths)
    // -------------------------------------------------------------------------

    @Test
    void handle_5xxError_logsAsError_completesSuccessfully() {
        // 5xx errors should be logged at ERROR level — verify handler completes
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics/summary")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Server failure")))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertTrue(statusCode.is5xxServerError(),
                "5xx exceptions should produce 5xx status codes");
    }

    @Test
    void handle_4xxError_logsAsWarn_completesSuccessfully() {
        // 4xx errors should be logged at WARN level — verify handler completes
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new IllegalArgumentException("Bad input")))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertTrue(statusCode.is4xxClientError(),
                "4xx exceptions should produce 4xx status codes");
    }

    @Test
    void handle_responseStatusException404_logsAsWarn_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/customers/99")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Customer not found");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode);
        assertEquals(404, statusCode.value());
    }

    // -------------------------------------------------------------------------
    // Path extraction tests
    // -------------------------------------------------------------------------

    @Test
    void handle_requestWithDeepPath_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics/metrics/revenue/monthly")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Error")))
                .verifyComplete();

        assertNotNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void handle_requestWithRootPath_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Error")))
                .verifyComplete();

        assertNotNull(exchange.getResponse().getStatusCode());
    }

    // -------------------------------------------------------------------------
    // ResponseStatusException reason message tests
    // -------------------------------------------------------------------------

    @Test
    void handle_responseStatusExceptionWithReason_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products/1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        ResponseStatusException exception = new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Product with ID 1 was not found");

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(404, exchange.getResponse().getStatusCode().value());
    }

    @Test
    void handle_responseStatusExceptionWithoutReason_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products/1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // ResponseStatusException with null reason
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.NOT_FOUND);

        StepVerifier.create(errorHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(404, exchange.getResponse().getStatusCode().value());
    }

    // -------------------------------------------------------------------------
    // HTTP method variety tests
    // -------------------------------------------------------------------------

    @Test
    void handle_postRequestError_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/customers")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Error")))
                .verifyComplete();

        assertNotNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void handle_putRequestError_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.PUT, "/api/products/5")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Error")))
                .verifyComplete();

        assertNotNull(exchange.getResponse().getStatusCode());
    }

    @Test
    void handle_deleteRequestError_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.DELETE, "/api/documents/10")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(errorHandler.handle(exchange, new RuntimeException("Error")))
                .verifyComplete();

        assertNotNull(exchange.getResponse().getStatusCode());
    }

    // -------------------------------------------------------------------------
    // Inner exception classes used for name-based status mapping tests
    // -------------------------------------------------------------------------

    /** Simulates an exception whose class name contains "notfound" → maps to 404. */
    static class CustomerNotFoundException extends RuntimeException {
        CustomerNotFoundException(String message) {
            super(message);
        }
    }

    /** Simulates an exception whose class name contains "timeout" → maps to 504. */
    static class GatewayTimeoutException extends RuntimeException {
        GatewayTimeoutException(String message) {
            super(message);
        }
    }

    /** Simulates an exception whose class name contains "connection" → maps to 502. */
    static class ServiceConnectionException extends RuntimeException {
        ServiceConnectionException(String message) {
            super(message);
        }
    }
}
