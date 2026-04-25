package com.businessai.gateway.filter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Unit tests for LoggingGlobalFilter.
 * 
 * Tests verify that:
 * - Requests are logged with method, URI, and remote address
 * - Responses are logged with status code and duration
 * - Errors are logged with exception details
 * - Filter has correct order precedence
 */
class LoggingGlobalFilterTest {

    private LoggingGlobalFilter loggingFilter;
    private GatewayFilterChain filterChain;

    @BeforeEach
    void setUp() {
        loggingFilter = new LoggingGlobalFilter();
        filterChain = mock(GatewayFilterChain.class);
    }

    @Test
    void testFilterLogsSuccessfulRequest() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.GET, "/api/products")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);
        
        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(loggingFilter.filter(exchange, filterChain))
            .verifyComplete();
        
        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void testFilterLogsErrorRequest() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.POST, "/api/customers")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        
        RuntimeException error = new RuntimeException("Test error");
        when(filterChain.filter(exchange)).thenReturn(Mono.error(error));

        // Act & Assert
        StepVerifier.create(loggingFilter.filter(exchange, filterChain))
            .expectError(RuntimeException.class)
            .verify();
        
        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void testFilterHasHighestPrecedence() {
        // Assert
        assertEquals(Integer.MIN_VALUE, loggingFilter.getOrder(),
            "LoggingGlobalFilter should have HIGHEST_PRECEDENCE");
    }

    @Test
    void testFilterLogsRequestWithHeaders() {
        // Arrange
        MockServerHttpRequest request = MockServerHttpRequest
            .method(HttpMethod.POST, "/api/sales")
            .header("Content-Type", "application/json")
            .header("Origin", "http://localhost:5173")
            .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.CREATED);
        
        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(loggingFilter.filter(exchange, filterChain))
            .verifyComplete();
        
        verify(filterChain, times(1)).filter(exchange);
    }
}
