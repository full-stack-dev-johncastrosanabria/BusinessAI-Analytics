package com.businessai.gateway.config;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

/**
 * Unit tests for GatewayConfig.
 *
 * Validates Requirements: 2.3.6
 *
 * Tests verify:
 * - Spring context loads with GatewayConfig present
 * - ObjectMapper bean is created and available for injection
 * - ObjectMapper has JavaTimeModule registered (handles Java 8 date/time types)
 * - ObjectMapper has WRITE_DATES_AS_TIMESTAMPS disabled (ISO-8601 format)
 */
@SpringBootTest
@ActiveProfiles("test")
class GatewayConfigTests {

    @Autowired
    private ObjectMapper objectMapper;

    // -------------------------------------------------------------------------
    // Spring context / bean availability tests
    // -------------------------------------------------------------------------

    @Test
    void contextLoads_gatewayConfigBeanIsAvailable() {
        assertNotNull(objectMapper, "ObjectMapper bean must be available in the Spring context");
    }

    // -------------------------------------------------------------------------
    // ObjectMapper configuration tests
    // -------------------------------------------------------------------------

    @Test
    void objectMapper_writeDatesAsTimestamps_isDisabled() {
        assertFalse(
            objectMapper.isEnabled(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS),
            "WRITE_DATES_AS_TIMESTAMPS must be disabled so dates serialize as ISO-8601 strings"
        );
    }

    @Test
    void objectMapper_javaTimeModule_isRegistered_serializesInstantAsIsoString() throws Exception {
        // If JavaTimeModule is registered and WRITE_DATES_AS_TIMESTAMPS is disabled,
        // an Instant must serialize as an ISO-8601 string, not a numeric array.
        Instant instant = Instant.parse("2024-06-15T10:30:00Z");

        String json = objectMapper.writeValueAsString(instant);

        // Must be a quoted ISO-8601 string, not a numeric timestamp
        assertTrue(json.startsWith("\""), "Instant must serialize as a quoted ISO-8601 string");
        assertTrue(json.contains("2024-06-15"), "Serialized Instant must contain the date portion");
    }

    @Test
    void objectMapper_javaTimeModule_isRegistered_serializesLocalDateTimeAsIsoString() throws Exception {
        LocalDateTime dateTime = LocalDateTime.of(2024, 3, 20, 14, 0, 0);

        String json = objectMapper.writeValueAsString(dateTime);

        // Must be a quoted ISO-8601 string, not a numeric array like [2024,3,20,14,0,0]
        assertTrue(json.startsWith("\""), "LocalDateTime must serialize as a quoted ISO-8601 string");
        assertFalse(json.startsWith("["), "LocalDateTime must NOT serialize as a numeric array");
        assertTrue(json.contains("2024-03-20"), "Serialized LocalDateTime must contain the date portion");
    }

    @Test
    void objectMapper_deserializesIsoInstantString_correctly() throws Exception {
        String isoString = "\"2024-06-15T10:30:00Z\"";

        Instant result = objectMapper.readValue(isoString, Instant.class);

        assertNotNull(result);
        Instant expected = Instant.ofEpochSecond(
            LocalDateTime.of(2024, 6, 15, 10, 30, 0).toEpochSecond(ZoneOffset.UTC)
        );
        assertTrue(result.equals(expected), "Deserialized Instant must match the original value");
    }
}
