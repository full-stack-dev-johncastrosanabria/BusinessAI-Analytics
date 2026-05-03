package com.businessai.sales.dto;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Unit tests for CustomerDTO.
 * Validates: Requirements 2.3.5
 */
@DisplayName("CustomerDTO Tests")
class CustomerDTOTests {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    // -------------------------------------------------------------------------
    // Field mapping / constructor tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Default constructor creates DTO with null fields")
    void defaultConstructor_createsEmptyDTO() {
        CustomerDTO dto = new CustomerDTO();

        assertThat(dto.getId()).isNull();
        assertThat(dto.getName()).isNull();
        assertThat(dto.getEmail()).isNull();
        assertThat(dto.getSegment()).isNull();
        assertThat(dto.getCountry()).isNull();
        assertThat(dto.getCreatedAt()).isNull();
        assertThat(dto.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("Parameterized constructor maps all provided fields")
    void parameterizedConstructor_mapsAllFields() {
        CustomerDTO dto = new CustomerDTO(1L, "Alice Smith", "alice@example.com", "Premium", "US");

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("Alice Smith");
        assertThat(dto.getEmail()).isEqualTo("alice@example.com");
        assertThat(dto.getSegment()).isEqualTo("Premium");
        assertThat(dto.getCountry()).isEqualTo("US");
    }

    @Test
    @DisplayName("Parameterized constructor leaves timestamp fields null")
    void parameterizedConstructor_timestampsAreNull() {
        CustomerDTO dto = new CustomerDTO(1L, "Alice", "alice@example.com", "Standard", "UK");

        assertThat(dto.getCreatedAt()).isNull();
        assertThat(dto.getUpdatedAt()).isNull();
    }

    // -------------------------------------------------------------------------
    // Getter / setter tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Setters update all fields correctly")
    void setters_updateAllFields() {
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 10, 30, 0);
        LocalDateTime later = LocalDateTime.of(2024, 6, 20, 14, 0, 0);

        CustomerDTO dto = new CustomerDTO();
        dto.setId(42L);
        dto.setName("Bob Jones");
        dto.setEmail("bob@example.com");
        dto.setSegment("Enterprise");
        dto.setCountry("CA");
        dto.setCreatedAt(now);
        dto.setUpdatedAt(later);

        assertThat(dto.getId()).isEqualTo(42L);
        assertThat(dto.getName()).isEqualTo("Bob Jones");
        assertThat(dto.getEmail()).isEqualTo("bob@example.com");
        assertThat(dto.getSegment()).isEqualTo("Enterprise");
        assertThat(dto.getCountry()).isEqualTo("CA");
        assertThat(dto.getCreatedAt()).isEqualTo(now);
        assertThat(dto.getUpdatedAt()).isEqualTo(later);
    }

    @Test
    @DisplayName("Setter allows overwriting existing values")
    void setter_overwritesExistingValue() {
        CustomerDTO dto = new CustomerDTO(1L, "Old Name", "old@example.com", "Basic", "US");
        dto.setName("New Name");
        dto.setEmail("new@example.com");

        assertThat(dto.getName()).isEqualTo("New Name");
        assertThat(dto.getEmail()).isEqualTo("new@example.com");
    }

    // -------------------------------------------------------------------------
    // Serialization tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Serializes to JSON with all fields present")
    void serialization_includesAllFields() throws Exception {
        CustomerDTO dto = new CustomerDTO(1L, "Alice Smith", "alice@example.com", "Premium", "US");

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).contains("\"id\":1");
        assertThat(json).contains("\"name\":\"Alice Smith\"");
        assertThat(json).contains("\"email\":\"alice@example.com\"");
        assertThat(json).contains("\"segment\":\"Premium\"");
        assertThat(json).contains("\"country\":\"US\"");
    }

    @Test
    @DisplayName("Serializes null fields as JSON null")
    void serialization_nullFieldsAreIncluded() throws Exception {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(5L);

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).contains("\"id\":5");
        assertThat(json).contains("\"name\":null");
        assertThat(json).contains("\"email\":null");
    }

    // -------------------------------------------------------------------------
    // Deserialization tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Deserializes from JSON and maps all fields")
    void deserialization_mapsAllFields() throws Exception {
        String json = "{\"id\":2,\"name\":\"Carol White\",\"email\":\"carol@example.com\"," +
                "\"segment\":\"Standard\",\"country\":\"DE\",\"createdAt\":null,\"updatedAt\":null}";

        CustomerDTO dto = objectMapper.readValue(json, CustomerDTO.class);

        assertThat(dto.getId()).isEqualTo(2L);
        assertThat(dto.getName()).isEqualTo("Carol White");
        assertThat(dto.getEmail()).isEqualTo("carol@example.com");
        assertThat(dto.getSegment()).isEqualTo("Standard");
        assertThat(dto.getCountry()).isEqualTo("DE");
    }

    @Test
    @DisplayName("Round-trip serialization preserves all field values")
    void roundTrip_preservesAllFields() throws Exception {
        LocalDateTime created = LocalDateTime.of(2024, 3, 10, 8, 0, 0);
        CustomerDTO original = new CustomerDTO(10L, "Dave Brown", "dave@example.com", "VIP", "FR");
        original.setCreatedAt(created);

        String json = objectMapper.writeValueAsString(original);
        CustomerDTO restored = objectMapper.readValue(json, CustomerDTO.class);

        assertThat(restored.getId()).isEqualTo(original.getId());
        assertThat(restored.getName()).isEqualTo(original.getName());
        assertThat(restored.getEmail()).isEqualTo(original.getEmail());
        assertThat(restored.getSegment()).isEqualTo(original.getSegment());
        assertThat(restored.getCountry()).isEqualTo(original.getCountry());
        assertThat(restored.getCreatedAt()).isEqualTo(original.getCreatedAt());
    }

    // -------------------------------------------------------------------------
    // equals / hashCode tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Two DTOs with the same id are equal")
    void equals_sameid_returnsTrue() {
        CustomerDTO a = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");
        CustomerDTO b = new CustomerDTO(1L, "Different Name", "b@example.com", "Basic", "UK");

        assertThat(a).isEqualTo(b);
    }

    @Test
    @DisplayName("Two DTOs with different ids are not equal")
    void equals_differentId_returnsFalse() {
        CustomerDTO a = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");
        CustomerDTO b = new CustomerDTO(2L, "Alice", "a@example.com", "Premium", "US");

        assertThat(a).isNotEqualTo(b);
    }

    @Test
    @DisplayName("DTO is equal to itself (reflexivity)")
    void equals_sameInstance_returnsTrue() {
        CustomerDTO dto = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");

        assertThat(dto).isEqualTo(dto);
    }

    @Test
    @DisplayName("DTO is not equal to null")
    void equals_null_returnsFalse() {
        CustomerDTO dto = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");

        assertThat(dto).isNotEqualTo(null);
    }

    @Test
    @DisplayName("DTO is not equal to an object of a different type")
    void equals_differentType_returnsFalse() {
        CustomerDTO dto = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");

        assertThat(dto).isNotEqualTo("some string");
    }

    @Test
    @DisplayName("hashCode is consistent with equals (same id → same hash)")
    void hashCode_sameId_sameHash() {
        CustomerDTO a = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");
        CustomerDTO b = new CustomerDTO(1L, "Bob", "b@example.com", "Basic", "UK");

        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    @DisplayName("hashCode differs for different ids")
    void hashCode_differentId_differentHash() {
        CustomerDTO a = new CustomerDTO(1L, "Alice", "a@example.com", "Premium", "US");
        CustomerDTO b = new CustomerDTO(2L, "Alice", "a@example.com", "Premium", "US");

        assertThat(a.hashCode()).isNotEqualTo(b.hashCode());
    }

    // -------------------------------------------------------------------------
    // toString test
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("toString contains all relevant field values")
    void toString_containsAllFields() {
        CustomerDTO dto = new CustomerDTO(7L, "Eve Green", "eve@example.com", "Gold", "AU");

        String result = dto.toString();

        assertThat(result).contains("7");
        assertThat(result).contains("Eve Green");
        assertThat(result).contains("eve@example.com");
        assertThat(result).contains("Gold");
        assertThat(result).contains("AU");
    }
}
