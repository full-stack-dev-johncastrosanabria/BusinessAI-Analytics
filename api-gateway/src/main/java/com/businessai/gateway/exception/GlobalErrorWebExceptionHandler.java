package com.businessai.gateway.exception;

import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;

import com.businessai.gateway.model.ErrorResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Mono;

/**
 * Global error handler for the API Gateway.
 * 
 * This handler catches all exceptions that occur during request processing
 * and returns standardized error responses with appropriate HTTP status codes:
 * - 400 Bad Request: For validation errors
 * - 404 Not Found: For resource not found errors
 * - 500 Internal Server Error: For unexpected errors
 * - 502 Bad Gateway: For downstream service failures
 * - 503 Service Unavailable: For service unavailability
 * - 504 Gateway Timeout: For timeout errors
 * 
 * The handler ensures consistent error format across all microservices
 * and logs all errors for debugging purposes.
 * 
 * Requirements: 17.8, 19.1, 19.5
 */
@Component
@Order(-2) // Higher precedence than default error handler
public class GlobalErrorWebExceptionHandler implements ErrorWebExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalErrorWebExceptionHandler.class);
    private final ObjectMapper objectMapper;

    public GlobalErrorWebExceptionHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    @SuppressWarnings("null")
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        if (exchange == null || ex == null) {
            return Mono.empty();
        }
        
        // Determine HTTP status and error message
        HttpStatus status = determineHttpStatus(ex);
        String path = exchange.getRequest().getURI().getPath();
        
        // Create standardized error response
        ErrorResponse errorResponse = createErrorResponse(status, ex, path);
        
        // Log the error
        logError(exchange, status, ex);
        
        // Set response status and content type
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        // Write error response to response body
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(errorResponse);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(bytes);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize error response", e);
            // Fallback to plain text error
            byte[] fallbackBytes = createFallbackErrorMessage(status).getBytes(StandardCharsets.UTF_8);
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(fallbackBytes);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        }
    }

    /**
     * Determine appropriate HTTP status code based on exception type.
     */
    private HttpStatus determineHttpStatus(Throwable ex) {
        if (ex == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
        
        if (ex instanceof ResponseStatusException rse) {
            HttpStatus resolved = HttpStatus.resolve(rse.getStatusCode().value());
            return resolved != null ? resolved : HttpStatus.INTERNAL_SERVER_ERROR;
        }
        
        // Check exception class name for common patterns
        String exceptionName = ex.getClass().getSimpleName().toLowerCase();
        
        if (exceptionName.contains("notfound") || exceptionName.contains("nosuch")) {
            return HttpStatus.NOT_FOUND;
        }
        
        if (exceptionName.contains("validation") || exceptionName.contains("illegal") 
            || exceptionName.contains("badrequest")) {
            return HttpStatus.BAD_REQUEST;
        }
        
        if (exceptionName.contains("timeout") || exceptionName.contains("timedout")) {
            return HttpStatus.GATEWAY_TIMEOUT;
        }
        
        if (exceptionName.contains("unavailable") || exceptionName.contains("connection")) {
            return HttpStatus.BAD_GATEWAY;
        }
        
        // Default to 500 Internal Server Error
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    /**
     * Create standardized error response object.
     */
    private ErrorResponse createErrorResponse(HttpStatus status, Throwable ex, String path) {
        String message = determineErrorMessage(ex, status);
        
        return new ErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            message,
            path
        );
    }

    /**
     * Determine appropriate error message based on exception and status.
     */
    private String determineErrorMessage(Throwable ex, HttpStatus status) {
        if (ex == null) {
            return status.getReasonPhrase();
        }
        
        // For ResponseStatusException, use the reason if available
        if (ex instanceof ResponseStatusException rse) {
            String reason = rse.getReason();
            if (reason != null && !reason.isEmpty()) {
                return reason;
            }
        }
        
        // For client errors (4xx), include exception message
        String exMessage = ex.getMessage();
        if (status.is4xxClientError() && exMessage != null && !exMessage.isEmpty()) {
            return exMessage;
        }
        
        // For server errors (5xx), use generic message to avoid exposing internals
        return switch (status) {
            case INTERNAL_SERVER_ERROR -> "An internal server error occurred. Please try again later.";
            case BAD_GATEWAY -> "Unable to reach downstream service. Please try again later.";
            case SERVICE_UNAVAILABLE -> "Service is temporarily unavailable. Please try again later.";
            case GATEWAY_TIMEOUT -> "Request timeout. The service took too long to respond.";
            default -> status.getReasonPhrase();
        };
    }

    /**
     * Log error with appropriate level based on status code.
     */
    private void logError(ServerWebExchange exchange, HttpStatus status, Throwable ex) {
        if (exchange == null || status == null || ex == null) {
            return;
        }
        
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();
        String message = ex.getMessage() != null ? ex.getMessage() : "No message";
        
        if (status.is5xxServerError()) {
            // Server errors are logged as ERROR with full stack trace
            logger.error("Server error processing request: {} {} -> Status: {} | Error: {}",
                method, path, status.value(), message, ex);
        } else if (status.is4xxClientError()) {
            // Client errors are logged as WARN without stack trace
            logger.warn("Client error processing request: {} {} -> Status: {} | Error: {}",
                method, path, status.value(), message);
        } else {
            // Other errors logged as INFO
            logger.info("Error processing request: {} {} -> Status: {} | Error: {}",
                method, path, status.value(), message);
        }
    }

    /**
     * Create fallback error message if JSON serialization fails.
     */
    private String createFallbackErrorMessage(HttpStatus status) {
        return String.format("{\"status\":%d,\"error\":\"%s\",\"message\":\"An error occurred\"}",
            status.value(), status.getReasonPhrase());
    }
}
