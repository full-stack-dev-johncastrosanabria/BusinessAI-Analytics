package com.businessai.gateway.model;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Unit tests for ErrorResponse model.
 *
 * Validates Requirements: 2.3.6
 *
 * Tests verify:
 * - Error response structure (message, timestamp, path, status, error, details)
 * - JSON serialization (fields present, null fields excluded via @JsonInclude)
 * - JSON deserialization (round-trip correctness)
 * - No-arg constructor auto-sets timestamp
 * - All-arg constructors populate fields correctly
 * - Setter/getter contracts
 */
class ErrorResponseTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // -------------------------------------------------------------------------
    // Structure tests
    // -------------------------------------------------------------------------

    @Test
    void noArgConstructor_setsTimestampAutomatically() {
        ErrorResponse response = new ErrorResponse();

        assertNotNull(response.getTimestamp(), "Timestamp must be set by no-arg constructor");
        // Verify it is a valid ISO-8601 instant
        Instant.parse(response.getTimestamp());
    }

    @Test
    void fourArgConstructor_populatesAllFields() {
        ErrorResponse response = new ErrorResponse(404, "Not Found", "Resource missing", "/api/items/1");

        assertEquals(404, response.getStatus());
        assertEquals("Not Found", response.getError());
        assertEquals("Resource missing", response.getMessage());
        assertEquals("/api/items/1", response.getPath());
        assertNotNull(response.getTimestamp());
        assertNull(response.getDetails(), "Details should be null when not provided");
    }

    @Test
    void fiveArgConstructor_populatesDetailsField() {
        Map<String, String> details = new HashMap<>();
        details.put("field", "must not be blank");

        ErrorResponse response = new ErrorResponse(400, "Bad Request", "Validation failed", "/api/items", details);

        assertEquals(400, response.getStatus());
        assertEquals("Bad Request", response.getError());
        assertEquals("Validation failed", response.getMessage());
        assertEquals("/api/items", response.getPath());
        assertNotNull(response.getDetails());
        assertEquals("must not be blank", response.getDetails().get("field"));
    }

    @Test
    void settersAndGetters_workCorrectly() {
        ErrorResponse response = new ErrorResponse();

        response.setStatus(500);
        response.setError("Internal Server Error");
        response.setMessage("Unexpected failure");
        response.setPath("/api/orders");
        response.setTimestamp("2024-06-01T12:00:00Z");

        Map<String, String> details = new HashMap<>();
        details.put("cause", "NullPointerException");
        response.setDetails(details);

        assertEquals(500, response.getStatus());
        assertEquals("Internal Server Error", response.getError());
        assertEquals("Unexpected failure", response.getMessage());
        assertEquals("/api/orders", response.getPath());
        assertEquals("2024-06-01T12:00:00Z", response.getTimestamp());
        assertEquals("NullPointerException", response.getDetails().get("cause"));
    }

    @Test
    void setDetails_toNull_returnsNull() {
        Map<String, String> details = new HashMap<>();
        details.put("k", "v");
        ErrorResponse response = new ErrorResponse(400, "Bad Request", "err", "/path", details);

        response.setDetails(null);

        assertNull(response.getDetails());
    }

    @Test
    void multipleDetails_allStoredAndRetrieved() {
        Map<String, String> details = new HashMap<>();
        details.put("name", "Name is required");
        details.put("email", "Invalid email format");
        details.put("price", "Price must be positive");

        ErrorResponse response = new ErrorResponse(400, "Bad Request", "Validation failed", "/api/products", details);

        assertEquals(3, response.getDetails().size());
        assertEquals("Name is required", response.getDetails().get("name"));
        assertEquals("Invalid email format", response.getDetails().get("email"));
        assertEquals("Price must be positive", response.getDetails().get("price"));
    }

    // -------------------------------------------------------------------------
    // Serialization tests
    // -------------------------------------------------------------------------

    @Test
    void jsonSerialization_includesAllNonNullFields() throws Exception {
        ErrorResponse response = new ErrorResponse(503, "Service Unavailable", "Gateway timeout", "/api/analytics");

        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"status\":503"));
        assertTrue(json.contains("\"error\":\"Service Unavailable\""));
        assertTrue(json.contains("\"message\":\"Gateway timeout\""));
        assertTrue(json.contains("\"path\":\"/api/analytics\""));
        assertTrue(json.contains("\"timestamp\""));
    }

    @Test
    void jsonSerialization_excludesNullDetails() throws Exception {
        // details is null → @JsonInclude(NON_NULL) must omit it
        ErrorResponse response = new ErrorResponse(404, "Not Found", "Not found", "/api/x");

        String json = objectMapper.writeValueAsString(response);

        assertFalse(json.contains("\"details\""), "Null details field must be omitted from JSON");
    }

    @Test
    void jsonSerialization_includesDetailsWhenPresent() throws Exception {
        Map<String, String> details = new HashMap<>();
        details.put("id", "must be a positive integer");

        ErrorResponse response = new ErrorResponse(400, "Bad Request", "Validation failed", "/api/customers", details);

        String json = objectMapper.writeValueAsString(response);

        assertTrue(json.contains("\"details\""));
        assertTrue(json.contains("\"id\":\"must be a positive integer\""));
    }

    @Test
    void jsonSerialization_roundTrip_preservesAllFields() throws Exception {
        Map<String, String> details = new HashMap<>();
        details.put("stock", "must be non-negative");

        ErrorResponse original = new ErrorResponse(422, "Unprocessable Entity", "Business rule violation", "/api/inventory", details);
        original.setTimestamp("2024-03-15T08:00:00Z");

        String json = objectMapper.writeValueAsString(original);
        ErrorResponse deserialized = objectMapper.readValue(json, ErrorResponse.class);

        assertEquals(original.getStatus(), deserialized.getStatus());
        assertEquals(original.getError(), deserialized.getError());
        assertEquals(original.getMessage(), deserialized.getMessage());
        assertEquals(original.getPath(), deserialized.getPath());
        assertEquals(original.getTimestamp(), deserialized.getTimestamp());
        assertNotNull(deserialized.getDetails());
        assertEquals("must be non-negative", deserialized.getDetails().get("stock"));
    }

    // -------------------------------------------------------------------------
    // Deserialization tests
    // -------------------------------------------------------------------------

    @Test
    void jsonDeserialization_fromMinimalJson_populatesFields() throws Exception {
        String json = "{\"timestamp\":\"2024-01-15T10:30:00Z\",\"status\":500," +
                "\"error\":\"Internal Server Error\",\"message\":\"Unexpected error\"," +
                "\"path\":\"/api/sales\"}";

        ErrorResponse response = objectMapper.readValue(json, ErrorResponse.class);

        assertEquals(500, response.getStatus());
        assertEquals("Internal Server Error", response.getError());
        assertEquals("Unexpected error", response.getMessage());
        assertEquals("/api/sales", response.getPath());
        assertEquals("2024-01-15T10:30:00Z", response.getTimestamp());
        assertNull(response.getDetails());
    }

    @Test
    void jsonDeserialization_withDetails_populatesDetailsMap() throws Exception {
        String json = "{\"timestamp\":\"2024-01-15T10:30:00Z\",\"status\":400," +
                "\"error\":\"Bad Request\",\"message\":\"Validation failed\"," +
                "\"path\":\"/api/documents\"," +
                "\"details\":{\"title\":\"Title is required\",\"size\":\"File too large\"}}";

        ErrorResponse response = objectMapper.readValue(json, ErrorResponse.class);

        assertNotNull(response.getDetails());
        assertEquals(2, response.getDetails().size());
        assertEquals("Title is required", response.getDetails().get("title"));
        assertEquals("File too large", response.getDetails().get("size"));
    }

    @Test
    void jsonDeserialization_unknownFields_ignoredWhenConfigured() throws Exception {
        // When the ObjectMapper is configured to ignore unknown properties
        // (as Spring Boot configures it by default), deserialization succeeds.
        ObjectMapper lenientMapper = new ObjectMapper()
                .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        String json = "{\"timestamp\":\"2024-01-15T10:30:00Z\",\"status\":404," +
                "\"error\":\"Not Found\",\"message\":\"Not found\",\"path\":\"/api/x\"," +
                "\"unknownField\":\"someValue\"}";

        ErrorResponse response = lenientMapper.readValue(json, ErrorResponse.class);

        assertEquals(404, response.getStatus());
        assertEquals("Not Found", response.getError());
    }

    // -------------------------------------------------------------------------
    // Field validation / boundary tests
    // -------------------------------------------------------------------------

    @Test
    void status_commonHttpCodes_storedCorrectly() {
        int[] codes = {200, 400, 401, 403, 404, 409, 422, 500, 502, 503};
        for (int code : codes) {
            ErrorResponse response = new ErrorResponse(code, "Reason", "msg", "/path");
            assertEquals(code, response.getStatus(), "Status code " + code + " should be stored as-is");
        }
    }

    @Test
    void emptyDetailsMap_serializedAsEmptyObject() throws Exception {
        Map<String, String> emptyDetails = new HashMap<>();
        ErrorResponse response = new ErrorResponse(400, "Bad Request", "err", "/path", emptyDetails);

        String json = objectMapper.writeValueAsString(response);

        // Empty map is non-null, so @JsonInclude(NON_NULL) keeps it
        assertTrue(json.contains("\"details\":{}"));
    }

    @Test
    void timestamp_canBeOverriddenViaSetter() {
        ErrorResponse response = new ErrorResponse();
        String customTimestamp = "2023-12-31T23:59:59Z";

        response.setTimestamp(customTimestamp);

        assertEquals(customTimestamp, response.getTimestamp());
    }

    @Test
    void jsonSerialization_statusFieldIsNumeric() throws Exception {
        ErrorResponse response = new ErrorResponse(401, "Unauthorized", "Auth required", "/api/secure");

        ObjectNode node = objectMapper.readValue(objectMapper.writeValueAsString(response), ObjectNode.class);

        assertTrue(node.get("status").isInt(), "status must serialize as a JSON number");
        assertEquals(401, node.get("status").asInt());
    }
}
