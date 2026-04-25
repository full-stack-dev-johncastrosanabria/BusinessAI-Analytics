package com.businessai.gateway.filter;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

/**
 * Global filter for logging all incoming requests and outgoing responses.
 * 
 * This filter logs:
 * - Request method, URI, and headers
 * - Response status code and processing time
 * - Any errors that occur during request processing
 * 
 * The filter runs with high precedence to capture timing information
 * for the entire request/response cycle.
 * 
 * Requirements: 17.8, 19.5
 */
@Component
public class LoggingGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(LoggingGlobalFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        Instant startTime = Instant.now();
        
        // Log incoming request
        logRequest(request);
        
        // Continue with the filter chain and log response
        return chain.filter(exchange)
            .doOnSuccess(aVoid -> logResponse(exchange, startTime))
            .doOnError(error -> logError(exchange, startTime, error));
    }

    /**
     * Log incoming request details.
     */
    private void logRequest(ServerHttpRequest request) {
        logger.info("Incoming Request: {} {} from {}",
            request.getMethod(),
            request.getURI(),
            request.getRemoteAddress());
        
        // Log important headers (excluding sensitive information)
        HttpHeaders headers = request.getHeaders();
        if (headers.getContentType() != null) {
            logger.debug("Content-Type: {}", headers.getContentType());
        }
        if (headers.getOrigin() != null) {
            logger.debug("Origin: {}", headers.getOrigin());
        }
    }

    /**
     * Log outgoing response details with processing time.
     */
    private void logResponse(ServerWebExchange exchange, Instant startTime) {
        ServerHttpResponse response = exchange.getResponse();
        ServerHttpRequest request = exchange.getRequest();
        Duration duration = Duration.between(startTime, Instant.now());
        
        logger.info("Outgoing Response: {} {} -> Status: {} | Duration: {}ms",
            request.getMethod(),
            request.getURI().getPath(),
            response.getStatusCode(),
            duration.toMillis());
    }

    /**
     * Log error details with processing time.
     */
    private void logError(ServerWebExchange exchange, Instant startTime, Throwable error) {
        ServerHttpRequest request = exchange.getRequest();
        Duration duration = Duration.between(startTime, Instant.now());
        
        logger.error("Request Failed: {} {} | Duration: {}ms | Error: {}",
            request.getMethod(),
            request.getURI().getPath(),
            duration.toMillis(),
            error.getMessage(),
            error);
    }

    /**
     * Set high precedence to ensure this filter runs early in the chain.
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
