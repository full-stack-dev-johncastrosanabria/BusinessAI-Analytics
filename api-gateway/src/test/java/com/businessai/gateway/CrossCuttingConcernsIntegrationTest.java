package com.businessai.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import com.businessai.gateway.model.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Integration tests for cross-cutting concerns (logging, error handling, CORS).
 * 
 * Tests verify that:
 * - Global error handler returns standardized error responses
 * - CORS headers are present in responses
 * - Logging filter processes requests without errors
 * - Error responses have correct format and status codes
 * 
 * Requirements: 17.8
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class CrossCuttingConcernsIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCorsHeadersPresent() {
        // Act & Assert
        webTestClient.options()
            .uri("/api/products")
            .header("Origin", "http://localhost:5173")
            .header("Access-Control-Request-Method", "GET")
            .exchange()
            .expectStatus().isOk()
            .expectHeader().exists("Access-Control-Allow-Origin")
            .expectHeader().valueEquals("Access-Control-Allow-Origin", "http://localhost:5173");
    }

    @Test
    void testNotFoundErrorResponse() {
        // Act & Assert
        webTestClient.get()
            .uri("/api/nonexistent")
            .exchange()
            .expectStatus().isNotFound()
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.status").isEqualTo(404)
            .jsonPath("$.error").isEqualTo("Not Found")
            .jsonPath("$.message").exists()
            .jsonPath("$.path").isEqualTo("/api/nonexistent")
            .jsonPath("$.timestamp").exists();
    }

    @Test
    void testErrorResponseFormat() throws Exception {
        // Act
        byte[] responseBody = webTestClient.get()
            .uri("/api/invalid-endpoint")
            .exchange()
            .expectStatus().isNotFound()
            .expectBody()
            .returnResult()
            .getResponseBody();

        // Assert
        ErrorResponse errorResponse = objectMapper.readValue(responseBody, ErrorResponse.class);
        
        assertNotNull(errorResponse);
        assertEquals(404, errorResponse.getStatus());
        assertEquals("Not Found", errorResponse.getError());
        assertNotNull(errorResponse.getMessage());
        assertEquals("/api/invalid-endpoint", errorResponse.getPath());
        assertNotNull(errorResponse.getTimestamp());
    }

    @Test
    void testLoggingFilterDoesNotInterfereWithRequests() {
        // This test verifies that the logging filter doesn't break normal request flow
        // Act & Assert
        webTestClient.get()
            .uri("/actuator/health")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void testMultipleRequestsHandledCorrectly() {
        // Test that logging and error handling work for multiple requests
        for (int i = 0; i < 5; i++) {
            webTestClient.get()
                .uri("/api/test-" + i)
                .exchange()
                .expectStatus().isNotFound()
                .expectBody()
                .jsonPath("$.status").isEqualTo(404)
                .jsonPath("$.path").isEqualTo("/api/test-" + i);
        }
    }

    @Test
    void testCorsWithDifferentMethods() {
        // Test CORS for different HTTP methods
        String[] methods = {"GET", "POST", "PUT", "DELETE"};
        
        for (String method : methods) {
            webTestClient.options()
                .uri("/api/products")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", method)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().exists("Access-Control-Allow-Methods");
        }
    }

    @Test
    void testErrorResponseContentType() {
        // Verify that error responses always return JSON
        webTestClient.get()
            .uri("/api/missing")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isNotFound()
            .expectHeader().contentType(MediaType.APPLICATION_JSON);
    }
}
