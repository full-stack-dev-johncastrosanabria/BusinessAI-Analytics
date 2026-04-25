package com.businessai.gateway.model;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests for ErrorResponse model.
 * 
 * Tests verify that:
 * - ErrorResponse can be created with all fields
 * - JSON serialization/deserialization works correctly
 * - Timestamp is automatically set
 * - Details field is optional (null when not provided)
 */
class ErrorResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testErrorResponseCreation() {
        // Act
        ErrorResponse response = new ErrorResponse(
            400,
            "Bad Request",
            "Validation failed",
            "/api/products"
        );

        // Assert
        assertEquals(400, response.getStatus());
        assertEquals("Bad Request", response.getError());
        assertEquals("Validation failed", response.getMessage());
        assertEquals("/api/products", response.getPath());
        assertNotNull(response.getTimestamp());
        assertNull(response.getDetails());
    }

    @Test
    void testErrorResponseWithDetails() {
        // Arrange
        Map<String, String> details = new HashMap<>();
        details.put("name", "Product name is required");
        details.put("price", "Price must be greater than zero");

        // Act
        ErrorResponse response = new ErrorResponse(
            400,
            "Bad Request",
            "Validation failed",
            "/api/products",
            details
        );

        // Assert
        assertEquals(400, response.getStatus());
        assertNotNull(response.getDetails());
        assertEquals(2, response.getDetails().size());
        assertEquals("Product name is required", response.getDetails().get("name"));
        assertEquals("Price must be greater than zero", response.getDetails().get("price"));
    }

    @Test
    void testJsonSerialization() throws Exception {
        // Arrange
        ErrorResponse response = new ErrorResponse(
            404,
            "Not Found",
            "Customer not found",
            "/api/customers/999"
        );

        // Act
        String json = objectMapper.writeValueAsString(response);

        // Assert
        assertTrue(json.contains("\"status\":404"));
        assertTrue(json.contains("\"error\":\"Not Found\""));
        assertTrue(json.contains("\"message\":\"Customer not found\""));
        assertTrue(json.contains("\"path\":\"/api/customers/999\""));
        assertTrue(json.contains("\"timestamp\""));
        assertFalse(json.contains("\"details\""), "Details should not be included when null");
    }

    @Test
    void testJsonDeserialization() throws Exception {
        // Arrange
        String json = "{\"timestamp\":\"2024-01-15T10:30:00Z\",\"status\":500," +
            "\"error\":\"Internal Server Error\",\"message\":\"An error occurred\"," +
            "\"path\":\"/api/sales\"}";

        // Act
        ErrorResponse response = objectMapper.readValue(json, ErrorResponse.class);

        // Assert
        assertEquals(500, response.getStatus());
        assertEquals("Internal Server Error", response.getError());
        assertEquals("An error occurred", response.getMessage());
        assertEquals("/api/sales", response.getPath());
        assertEquals("2024-01-15T10:30:00Z", response.getTimestamp());
    }

    @Test
    void testJsonSerializationWithDetails() throws Exception {
        // Arrange
        Map<String, String> details = new HashMap<>();
        details.put("email", "Invalid email format");
        
        ErrorResponse response = new ErrorResponse(
            400,
            "Bad Request",
            "Validation failed",
            "/api/customers",
            details
        );

        // Act
        String json = objectMapper.writeValueAsString(response);

        // Assert
        assertTrue(json.contains("\"details\""));
        assertTrue(json.contains("\"email\":\"Invalid email format\""));
    }

    @Test
    void testSettersAndGetters() {
        // Arrange
        ErrorResponse response = new ErrorResponse();

        // Act
        response.setStatus(403);
        response.setError("Forbidden");
        response.setMessage("Access denied");
        response.setPath("/api/documents");
        response.setTimestamp("2024-01-15T10:30:00Z");
        
        Map<String, String> details = new HashMap<>();
        details.put("reason", "Insufficient permissions");
        response.setDetails(details);

        // Assert
        assertEquals(403, response.getStatus());
        assertEquals("Forbidden", response.getError());
        assertEquals("Access denied", response.getMessage());
        assertEquals("/api/documents", response.getPath());
        assertEquals("2024-01-15T10:30:00Z", response.getTimestamp());
        assertNotNull(response.getDetails());
        assertEquals("Insufficient permissions", response.getDetails().get("reason"));
    }
}
