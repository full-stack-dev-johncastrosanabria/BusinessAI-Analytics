package com.businessai.gateway.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;

import com.fasterxml.jackson.databind.ObjectMapper;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import reactor.test.StepVerifier;

/**
 * Property-based tests for GlobalErrorWebExceptionHandler.
 * 
 * **Property 22: API Gateway Status Code Correctness**
 * **Validates: Requirements 17.8**
 * 
 * These tests verify that the API Gateway returns correct HTTP status codes
 * for different error conditions:
 * - 200 for successful operations (not tested here as this is error handler)
 * - 400 for validation errors
 * - 404 for resource not found
 * - 500 for server errors
 */
class GlobalErrorWebExceptionHandlerProperties {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GlobalErrorWebExceptionHandler errorHandler = 
        new GlobalErrorWebExceptionHandler(objectMapper);

    /**
     * Property: All ResponseStatusException instances with 404 status
     * should result in HTTP 404 responses.
     * 
     * **Validates: Requirements 17.8**
     */
    @Property
    void notFoundExceptionsReturn404(@ForAll("notFoundExceptions") ResponseStatusException exception,
                                      @ForAll("httpPaths") String path) {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, path)
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode, "Status code should not be null");
        assertEquals(HttpStatus.NOT_FOUND.value(), statusCode.value(),
            "NOT_FOUND exceptions should return 404 status code");
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType(),
            "Response should have JSON content type");
    }

    /**
     * Property: All validation-related exceptions should result in HTTP 400 responses.
     * 
     * **Validates: Requirements 17.8**
     */
    @Property
    void validationExceptionsReturn400(@ForAll("validationExceptions") Exception exception,
                                        @ForAll("httpPaths") String path) {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.POST, path)
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode, "Status code should not be null");
        assertEquals(HttpStatus.BAD_REQUEST.value(), statusCode.value(),
            "Validation exceptions should return 400 status code");
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType(),
            "Response should have JSON content type");
    }

    /**
     * Property: All ResponseStatusException instances with 400 status
     * should result in HTTP 400 responses.
     * 
     * **Validates: Requirements 17.8**
     */
    @Property
    void badRequestExceptionsReturn400(@ForAll("badRequestExceptions") ResponseStatusException exception,
                                        @ForAll("httpPaths") String path) {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.POST, path)
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode, "Status code should not be null");
        assertEquals(HttpStatus.BAD_REQUEST.value(), statusCode.value(),
            "BAD_REQUEST exceptions should return 400 status code");
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType(),
            "Response should have JSON content type");
    }

    /**
     * Property: All generic exceptions (not specifically mapped) should result 
     * in HTTP 500 responses.
     * 
     * **Validates: Requirements 17.8**
     */
    @Property
    void genericExceptionsReturn500(@ForAll("genericExceptions") Exception exception,
                                     @ForAll("httpPaths") String path) {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, path)
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode, "Status code should not be null");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), statusCode.value(),
            "Generic exceptions should return 500 status code");
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType(),
            "Response should have JSON content type");
    }

    /**
     * Property: All ResponseStatusException instances with 500 status
     * should result in HTTP 500 responses.
     * 
     * **Validates: Requirements 17.8**
     */
    @Property
    void internalServerErrorExceptionsReturn500(@ForAll("internalServerErrorExceptions") ResponseStatusException exception,
                                                 @ForAll("httpPaths") String path) {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, path)
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Act
        StepVerifier.create(errorHandler.handle(exchange, exception))
            .verifyComplete();

        // Assert
        HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
        assertNotNull(statusCode, "Status code should not be null");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), statusCode.value(),
            "INTERNAL_SERVER_ERROR exceptions should return 500 status code");
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType(),
            "Response should have JSON content type");
    }

    // Providers for generating test data

    @Provide
    Arbitrary<ResponseStatusException> notFoundExceptions() {
        return Arbitraries.strings()
            .alpha()
            .ofMinLength(5)
            .ofMaxLength(50)
            .map(message -> new ResponseStatusException(HttpStatus.NOT_FOUND, message));
    }

    @Provide
    Arbitrary<ResponseStatusException> badRequestExceptions() {
        return Arbitraries.strings()
            .alpha()
            .ofMinLength(5)
            .ofMaxLength(50)
            .map(message -> new ResponseStatusException(HttpStatus.BAD_REQUEST, message));
    }

    @Provide
    Arbitrary<ResponseStatusException> internalServerErrorExceptions() {
        return Arbitraries.strings()
            .alpha()
            .ofMinLength(5)
            .ofMaxLength(50)
            .map(message -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, message));
    }

    @Provide
    Arbitrary<Exception> validationExceptions() {
        return Arbitraries.strings()
            .alpha()
            .ofMinLength(5)
            .ofMaxLength(50)
            .map(message -> {
                // Generate different types of validation exceptions that match the handler's logic
                int type = message.hashCode() % 2;
                return switch (type) {
                    case 0 -> new IllegalArgumentException(message);
                    default -> new IllegalStateException(message);
                };
            });
    }

    @Provide
    Arbitrary<Exception> genericExceptions() {
        return Arbitraries.strings()
            .alpha()
            .ofMinLength(5)
            .ofMaxLength(50)
            .map(message -> {
                // Generate different types of generic exceptions
                int type = message.hashCode() % 3;
                return switch (type) {
                    case 0 -> new RuntimeException(message);
                    case 1 -> new Exception(message);
                    default -> new NullPointerException(message);
                };
            });
    }

    @Provide
    Arbitrary<String> httpPaths() {
        return Arbitraries.of(
            "/api/products",
            "/api/products/123",
            "/api/customers",
            "/api/customers/456",
            "/api/sales",
            "/api/sales/789",
            "/api/metrics",
            "/api/documents",
            "/api/forecasts/sales",
            "/api/chatbot/query"
        );
    }
}
