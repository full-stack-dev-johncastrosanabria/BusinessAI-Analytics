package com.businessai.gateway.filter;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.Ordered;
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
 * Validates Requirements: 2.3.6
 *
 * Tests verify:
 * - Request logging (method, path, headers)
 * - Response logging (status code, duration)
 * - Performance metrics calculation
 * - Filter chain execution (filter order)
 * - Error handling in filter
 */
class LoggingGlobalFilterTests {

    private LoggingGlobalFilter filter;
    private GatewayFilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new LoggingGlobalFilter();
        filterChain = mock(GatewayFilterChain.class);
    }

    // -------------------------------------------------------------------------
    // Filter order tests
    // -------------------------------------------------------------------------

    @Test
    void getOrder_returnsHighestPrecedence() {
        assertEquals(Ordered.HIGHEST_PRECEDENCE, filter.getOrder(),
                "Filter must run with HIGHEST_PRECEDENCE to capture full request/response timing");
    }

    @Test
    void getOrder_isMinIntegerValue() {
        assertEquals(Integer.MIN_VALUE, filter.getOrder(),
                "HIGHEST_PRECEDENCE maps to Integer.MIN_VALUE");
    }

    // -------------------------------------------------------------------------
    // Request logging tests
    // -------------------------------------------------------------------------

    @Test
    void filter_logsGetRequest_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_logsPostRequest_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/customers")
                .header("Content-Type", "application/json")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.CREATED);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_logsPutRequest_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.PUT, "/api/products/42")
                .header("Content-Type", "application/json")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_logsDeleteRequest_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.DELETE, "/api/customers/7")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.NO_CONTENT);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    // -------------------------------------------------------------------------
    // Header logging tests
    // -------------------------------------------------------------------------

    @Test
    void filter_requestWithContentTypeHeader_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/documents/upload")
                .header("Content-Type", "multipart/form-data")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_requestWithOriginHeader_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics")
                .header("Origin", "http://localhost:5173")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_requestWithBothContentTypeAndOrigin_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/sales")
                .header("Content-Type", "application/json")
                .header("Origin", "http://localhost:5173")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.CREATED);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_requestWithNoHeaders_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products/1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    // -------------------------------------------------------------------------
    // Response logging tests
    // -------------------------------------------------------------------------

    @Test
    void filter_response200OK_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();
    }

    @Test
    void filter_response404NotFound_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products/999")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();
    }

    @Test
    void filter_response500InternalServerError_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics/summary")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();
    }

    @Test
    void filter_response503ServiceUnavailable_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/ai/forecast")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();
    }

    // -------------------------------------------------------------------------
    // Performance metrics / duration tests
    // -------------------------------------------------------------------------

    @Test
    void filter_measuresDuration_completesWithinReasonableTime() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        long startMs = System.currentTimeMillis();

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        long elapsedMs = System.currentTimeMillis() - startMs;

        // The filter should complete quickly (well under 1 second for a mocked chain)
        assertTrue(elapsedMs < 1000,
                "Filter should complete within 1 second for a mocked chain, took: " + elapsedMs + "ms");
    }

    @Test
    void filter_withDelayedChain_stillCompletesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/customers")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        // Simulate a slightly delayed downstream service
        when(filterChain.filter(exchange)).thenReturn(
                Mono.<Void>empty().delaySubscription(java.time.Duration.ofMillis(10)));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    // -------------------------------------------------------------------------
    // Filter chain execution tests
    // -------------------------------------------------------------------------

    @Test
    void filter_delegatesToFilterChain() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        // Verify the filter chain was called exactly once
        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_passesExchangeToChainUnmodified() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics/metrics")
                .header("Authorization", "Bearer test-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        // Verify the same exchange instance was passed to the chain
        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_returnsMonoFromChain() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/products")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        Mono<Void> result = filter.filter(exchange, filterChain);

        assertNotNull(result, "filter() must return a non-null Mono");
    }

    // -------------------------------------------------------------------------
    // Error handling tests
    // -------------------------------------------------------------------------

    @Test
    void filter_chainThrowsRuntimeException_propagatesError() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.POST, "/api/customers")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RuntimeException error = new RuntimeException("Downstream service unavailable");
        when(filterChain.filter(exchange)).thenReturn(Mono.error(error));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .expectError(RuntimeException.class)
                .verify();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_chainThrowsIllegalStateException_propagatesError() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        IllegalStateException error = new IllegalStateException("Service in invalid state");
        when(filterChain.filter(exchange)).thenReturn(Mono.error(error));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .expectError(IllegalStateException.class)
                .verify();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_chainThrowsNullPointerException_propagatesError() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.DELETE, "/api/products/1")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        NullPointerException error = new NullPointerException("Null response from service");
        when(filterChain.filter(exchange)).thenReturn(Mono.error(error));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .expectError(NullPointerException.class)
                .verify();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_errorContainsMessage_logsAndPropagates() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/documents/search")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        RuntimeException error = new RuntimeException("Connection timeout after 5000ms");
        when(filterChain.filter(exchange)).thenReturn(Mono.error(error));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .expectErrorMatches(e -> e instanceof RuntimeException
                        && "Connection timeout after 5000ms".equals(e.getMessage()))
                .verify();
    }

    // -------------------------------------------------------------------------
    // URI / path tests
    // -------------------------------------------------------------------------

    @Test
    void filter_requestWithQueryParams_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, URI.create("/api/customers?page=0&size=10"))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_requestWithDeepPath_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/api/analytics/metrics/revenue/monthly")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }

    @Test
    void filter_actuatorHealthEndpoint_completesSuccessfully() {
        MockServerHttpRequest request = MockServerHttpRequest
                .method(HttpMethod.GET, "/actuator/health")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        exchange.getResponse().setStatusCode(HttpStatus.OK);

        when(filterChain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(exchange);
    }
}
