package com.businessai.sales.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Unit tests for ProductDTO.
 * Validates: Requirements 2.3.5
 */
@DisplayName("ProductDTO Tests")
class ProductDTOTests {

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
        ProductDTO dto = new ProductDTO();

        assertThat(dto.getId()).isNull();
        assertThat(dto.getName()).isNull();
        assertThat(dto.getCategory()).isNull();
        assertThat(dto.getCost()).isNull();
        assertThat(dto.getPrice()).isNull();
        assertThat(dto.getCreatedAt()).isNull();
        assertThat(dto.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("Parameterized constructor maps all provided fields")
    void parameterizedConstructor_mapsAllFields() {
        BigDecimal cost = new BigDecimal("49.99");
        BigDecimal price = new BigDecimal("99.99");

        ProductDTO dto = new ProductDTO(1L, "Widget Pro", "Electronics", cost, price);

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getName()).isEqualTo("Widget Pro");
        assertThat(dto.getCategory()).isEqualTo("Electronics");
        assertThat(dto.getCost()).isEqualByComparingTo(cost);
        assertThat(dto.getPrice()).isEqualByComparingTo(price);
    }

    @Test
    @DisplayName("Parameterized constructor leaves timestamp fields null")
    void parameterizedConstructor_timestampsAreNull() {
        ProductDTO dto = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));

        assertThat(dto.getCreatedAt()).isNull();
        assertThat(dto.getUpdatedAt()).isNull();
    }

    // -------------------------------------------------------------------------
    // Getter / setter tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Setters update all fields correctly")
    void setters_updateAllFields() {
        LocalDateTime now = LocalDateTime.of(2024, 2, 1, 9, 0, 0);
        LocalDateTime later = LocalDateTime.of(2024, 8, 15, 17, 30, 0);
        BigDecimal cost = new BigDecimal("25.50");
        BigDecimal price = new BigDecimal("59.95");

        ProductDTO dto = new ProductDTO();
        dto.setId(99L);
        dto.setName("Super Gadget");
        dto.setCategory("Gadgets");
        dto.setCost(cost);
        dto.setPrice(price);
        dto.setCreatedAt(now);
        dto.setUpdatedAt(later);

        assertThat(dto.getId()).isEqualTo(99L);
        assertThat(dto.getName()).isEqualTo("Super Gadget");
        assertThat(dto.getCategory()).isEqualTo("Gadgets");
        assertThat(dto.getCost()).isEqualByComparingTo(cost);
        assertThat(dto.getPrice()).isEqualByComparingTo(price);
        assertThat(dto.getCreatedAt()).isEqualTo(now);
        assertThat(dto.getUpdatedAt()).isEqualTo(later);
    }

    @Test
    @DisplayName("Setter allows overwriting existing values")
    void setter_overwritesExistingValue() {
        ProductDTO dto = new ProductDTO(1L, "Old Name", "OldCat",
                new BigDecimal("5.00"), new BigDecimal("10.00"));
        dto.setName("New Name");
        dto.setCategory("NewCat");

        assertThat(dto.getName()).isEqualTo("New Name");
        assertThat(dto.getCategory()).isEqualTo("NewCat");
    }

    @Test
    @DisplayName("Cost and price accept zero values")
    void setters_acceptZeroValues() {
        ProductDTO dto = new ProductDTO();
        dto.setCost(BigDecimal.ZERO);
        dto.setPrice(BigDecimal.ZERO);

        assertThat(dto.getCost()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(dto.getPrice()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Cost and price accept large decimal values")
    void setters_acceptLargeDecimalValues() {
        BigDecimal largeCost = new BigDecimal("999999.99");
        BigDecimal largePrice = new BigDecimal("1999999.99");

        ProductDTO dto = new ProductDTO();
        dto.setCost(largeCost);
        dto.setPrice(largePrice);

        assertThat(dto.getCost()).isEqualByComparingTo(largeCost);
        assertThat(dto.getPrice()).isEqualByComparingTo(largePrice);
    }

    // -------------------------------------------------------------------------
    // Serialization tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Serializes to JSON with all fields present")
    void serialization_includesAllFields() throws Exception {
        ProductDTO dto = new ProductDTO(3L, "Laptop", "Computers",
                new BigDecimal("500.00"), new BigDecimal("999.00"));

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).contains("\"id\":3");
        assertThat(json).contains("\"name\":\"Laptop\"");
        assertThat(json).contains("\"category\":\"Computers\"");
        assertThat(json).contains("500.00");
        assertThat(json).contains("999.00");
    }

    @Test
    @DisplayName("Serializes null fields as JSON null")
    void serialization_nullFieldsAreIncluded() throws Exception {
        ProductDTO dto = new ProductDTO();
        dto.setId(8L);

        String json = objectMapper.writeValueAsString(dto);

        assertThat(json).contains("\"id\":8");
        assertThat(json).contains("\"name\":null");
        assertThat(json).contains("\"category\":null");
        assertThat(json).contains("\"cost\":null");
        assertThat(json).contains("\"price\":null");
    }

    // -------------------------------------------------------------------------
    // Deserialization tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Deserializes from JSON and maps all fields")
    void deserialization_mapsAllFields() throws Exception {
        String json = "{\"id\":4,\"name\":\"Keyboard\",\"category\":\"Peripherals\"," +
                "\"cost\":15.00,\"price\":45.00,\"createdAt\":null,\"updatedAt\":null}";

        ProductDTO dto = objectMapper.readValue(json, ProductDTO.class);

        assertThat(dto.getId()).isEqualTo(4L);
        assertThat(dto.getName()).isEqualTo("Keyboard");
        assertThat(dto.getCategory()).isEqualTo("Peripherals");
        assertThat(dto.getCost()).isEqualByComparingTo(new BigDecimal("15.00"));
        assertThat(dto.getPrice()).isEqualByComparingTo(new BigDecimal("45.00"));
    }

    @Test
    @DisplayName("Round-trip serialization preserves all field values")
    void roundTrip_preservesAllFields() throws Exception {
        LocalDateTime created = LocalDateTime.of(2024, 5, 20, 12, 0, 0);
        ProductDTO original = new ProductDTO(20L, "Monitor", "Displays",
                new BigDecimal("200.00"), new BigDecimal("399.99"));
        original.setCreatedAt(created);

        String json = objectMapper.writeValueAsString(original);
        ProductDTO restored = objectMapper.readValue(json, ProductDTO.class);

        assertThat(restored.getId()).isEqualTo(original.getId());
        assertThat(restored.getName()).isEqualTo(original.getName());
        assertThat(restored.getCategory()).isEqualTo(original.getCategory());
        assertThat(restored.getCost()).isEqualByComparingTo(original.getCost());
        assertThat(restored.getPrice()).isEqualByComparingTo(original.getPrice());
        assertThat(restored.getCreatedAt()).isEqualTo(original.getCreatedAt());
    }

    // -------------------------------------------------------------------------
    // equals / hashCode tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Two DTOs with the same id are equal")
    void equals_sameId_returnsTrue() {
        ProductDTO a = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));
        ProductDTO b = new ProductDTO(1L, "Different", "Other",
                new BigDecimal("5.00"), new BigDecimal("15.00"));

        assertThat(a).isEqualTo(b);
    }

    @Test
    @DisplayName("Two DTOs with different ids are not equal")
    void equals_differentId_returnsFalse() {
        ProductDTO a = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));
        ProductDTO b = new ProductDTO(2L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));

        assertThat(a).isNotEqualTo(b);
    }

    @Test
    @DisplayName("DTO is equal to itself (reflexivity)")
    void equals_sameInstance_returnsTrue() {
        ProductDTO dto = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));

        assertThat(dto).isEqualTo(dto);
    }

    @Test
    @DisplayName("DTO is not equal to null")
    void equals_null_returnsFalse() {
        ProductDTO dto = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));

        assertThat(dto).isNotEqualTo(null);
    }

    @Test
    @DisplayName("DTO is not equal to an object of a different type")
    void equals_differentType_returnsFalse() {
        ProductDTO dto = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));

        assertThat(dto).isNotEqualTo("some string");
    }

    @Test
    @DisplayName("hashCode is consistent with equals (same id → same hash)")
    void hashCode_sameId_sameHash() {
        ProductDTO a = new ProductDTO(5L, "A", "CatA",
                new BigDecimal("1.00"), new BigDecimal("2.00"));
        ProductDTO b = new ProductDTO(5L, "B", "CatB",
                new BigDecimal("3.00"), new BigDecimal("4.00"));

        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    @DisplayName("hashCode differs for different ids")
    void hashCode_differentId_differentHash() {
        ProductDTO a = new ProductDTO(1L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));
        ProductDTO b = new ProductDTO(2L, "Widget", "Tools",
                new BigDecimal("10.00"), new BigDecimal("20.00"));

        assertThat(a.hashCode()).isNotEqualTo(b.hashCode());
    }

    // -------------------------------------------------------------------------
    // toString test
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("toString contains all relevant field values")
    void toString_containsAllFields() {
        ProductDTO dto = new ProductDTO(12L, "Headphones", "Audio",
                new BigDecimal("30.00"), new BigDecimal("79.99"));

        String result = dto.toString();

        assertThat(result).contains("12");
        assertThat(result).contains("Headphones");
        assertThat(result).contains("Audio");
        assertThat(result).contains("30.00");
        assertThat(result).contains("79.99");
    }
}
