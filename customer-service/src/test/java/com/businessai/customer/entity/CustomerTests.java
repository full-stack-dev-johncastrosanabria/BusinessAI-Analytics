package com.businessai.customer.entity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Comprehensive unit tests for Customer entity.
 * Tests entity validation, field constraints, email format, data integrity, and equals/hashCode contracts.
 * Validates: Requirements 2.3.3
 */
@DisplayName("Customer Entity Tests")
class CustomerTests {

    private Customer customer;

    @BeforeEach
    void setUp() {
        customer = new Customer();
    }

    @Nested
    @DisplayName("Entity Validation Tests")
    class EntityValidationTests {

        @Test
        @DisplayName("Should create valid customer with all required fields")
        void testValidCustomerCreation() {
            // Arrange
            String name = "John Doe";
            String email = "john.doe@example.com";
            String segment = "Enterprise";
            String country = "USA";

            // Act
            Customer validCustomer = new Customer(name, email, segment, country);

            // Assert
            assertNull(validCustomer.getId());
            assertEquals(name, validCustomer.getName());
            assertEquals(email, validCustomer.getEmail());
            assertEquals(segment, validCustomer.getSegment());
            assertEquals(country, validCustomer.getCountry());
            assertNull(validCustomer.getCreatedAt());
            assertNull(validCustomer.getUpdatedAt());
        }

        @Test
        @DisplayName("Should create customer with default constructor")
        void testDefaultConstructor() {
            // Act
            Customer newCustomer = new Customer();

            // Assert
            assertNull(newCustomer.getId());
            assertNull(newCustomer.getName());
            assertNull(newCustomer.getEmail());
            assertNull(newCustomer.getSegment());
            assertNull(newCustomer.getCountry());
        }

        @Test
        @DisplayName("Should set and get all customer fields")
        void testCustomerFieldsSetAndGet() {
            // Arrange
            Long id = 1L;
            String name = "Jane Smith";
            String email = "jane.smith@example.com";
            String segment = "SMB";
            String country = "Canada";
            LocalDateTime now = LocalDateTime.now();

            // Act
            customer.setId(id);
            customer.setName(name);
            customer.setEmail(email);
            customer.setSegment(segment);
            customer.setCountry(country);
            customer.setCreatedAt(now);
            customer.setUpdatedAt(now);

            // Assert
            assertEquals(id, customer.getId());
            assertEquals(name, customer.getName());
            assertEquals(email, customer.getEmail());
            assertEquals(segment, customer.getSegment());
            assertEquals(country, customer.getCountry());
            assertEquals(now, customer.getCreatedAt());
            assertEquals(now, customer.getUpdatedAt());
        }
    }

    @Nested
    @DisplayName("Field Constraints Tests")
    class FieldConstraintsTests {

        @Test
        @DisplayName("Should accept valid customer name")
        void testValidCustomerName() {
            // Act
            customer.setName("Valid Customer Name");

            // Assert
            assertEquals("Valid Customer Name", customer.getName());
        }

        @Test
        @DisplayName("Should accept valid segment")
        void testValidSegment() {
            // Act
            customer.setSegment("Enterprise");

            // Assert
            assertEquals("Enterprise", customer.getSegment());
        }

        @Test
        @DisplayName("Should accept valid country")
        void testValidCountry() {
            // Act
            customer.setCountry("USA");

            // Assert
            assertEquals("USA", customer.getCountry());
        }

        @Test
        @DisplayName("Should accept long customer name within length limit")
        void testLongCustomerName() {
            // Arrange
            String longName = "A".repeat(255); // Max column length

            // Act
            customer.setName(longName);

            // Assert
            assertEquals(longName, customer.getName());
        }

        @Test
        @DisplayName("Should accept long segment within length limit")
        void testLongSegment() {
            // Arrange
            String longSegment = "B".repeat(100); // Max column length

            // Act
            customer.setSegment(longSegment);

            // Assert
            assertEquals(longSegment, customer.getSegment());
        }

        @Test
        @DisplayName("Should accept long country within length limit")
        void testLongCountry() {
            // Arrange
            String longCountry = "C".repeat(100); // Max column length

            // Act
            customer.setCountry(longCountry);

            // Assert
            assertEquals(longCountry, customer.getCountry());
        }

        @Test
        @DisplayName("Should accept null name (validation handled by annotations)")
        void testNullName() {
            // Act
            customer.setName(null);

            // Assert
            assertNull(customer.getName());
        }

        @Test
        @DisplayName("Should accept null segment (validation handled by annotations)")
        void testNullSegment() {
            // Act
            customer.setSegment(null);

            // Assert
            assertNull(customer.getSegment());
        }

        @Test
        @DisplayName("Should accept null country (validation handled by annotations)")
        void testNullCountry() {
            // Act
            customer.setCountry(null);

            // Assert
            assertNull(customer.getCountry());
        }
    }

    @Nested
    @DisplayName("Email Format Validation Tests")
    class EmailFormatValidationTests {

        @Test
        @DisplayName("Should accept valid email with standard format")
        void testValidEmailStandardFormat() {
            // Act
            customer.setEmail("user@example.com");

            // Assert
            assertEquals("user@example.com", customer.getEmail());
        }

        @Test
        @DisplayName("Should accept valid email with subdomain")
        void testValidEmailWithSubdomain() {
            // Act
            customer.setEmail("user@mail.example.com");

            // Assert
            assertEquals("user@mail.example.com", customer.getEmail());
        }

        @Test
        @DisplayName("Should accept valid email with plus sign")
        void testValidEmailWithPlusSign() {
            // Act
            customer.setEmail("user+tag@example.com");

            // Assert
            assertEquals("user+tag@example.com", customer.getEmail());
        }

        @Test
        @DisplayName("Should accept valid email with dots in local part")
        void testValidEmailWithDotsInLocalPart() {
            // Act
            customer.setEmail("first.last@example.com");

            // Assert
            assertEquals("first.last@example.com", customer.getEmail());
        }

        @Test
        @DisplayName("Should accept null email (validation handled by annotations)")
        void testNullEmail() {
            // Act
            customer.setEmail(null);

            // Assert
            assertNull(customer.getEmail());
        }

        @Test
        @DisplayName("Should accept long email within length limit")
        void testLongEmail() {
            // Arrange - 255 chars total: local@domain.com
            String localPart = "a".repeat(240);
            String email = localPart + "@b.com";

            // Act
            customer.setEmail(email);

            // Assert
            assertEquals(email, customer.getEmail());
        }
    }

    @Nested
    @DisplayName("Data Integrity Tests")
    class DataIntegrityTests {

        @Test
        @DisplayName("Should retain all required fields after construction")
        void testRequiredFieldsRetainedAfterConstruction() {
            // Arrange & Act
            Customer c = new Customer("Alice", "alice@example.com", "Retail", "UK");

            // Assert
            assertEquals("Alice", c.getName());
            assertEquals("alice@example.com", c.getEmail());
            assertEquals("Retail", c.getSegment());
            assertEquals("UK", c.getCountry());
        }

        @Test
        @DisplayName("Should allow updating name after construction")
        void testNameUpdateAfterConstruction() {
            // Arrange
            Customer c = new Customer("Old Name", "test@example.com", "SMB", "USA");

            // Act
            c.setName("New Name");

            // Assert
            assertEquals("New Name", c.getName());
        }

        @Test
        @DisplayName("Should allow updating email after construction")
        void testEmailUpdateAfterConstruction() {
            // Arrange
            Customer c = new Customer("Test User", "old@example.com", "SMB", "USA");

            // Act
            c.setEmail("new@example.com");

            // Assert
            assertEquals("new@example.com", c.getEmail());
        }

        @Test
        @DisplayName("Should allow updating segment after construction")
        void testSegmentUpdateAfterConstruction() {
            // Arrange
            Customer c = new Customer("Test User", "test@example.com", "SMB", "USA");

            // Act
            c.setSegment("Enterprise");

            // Assert
            assertEquals("Enterprise", c.getSegment());
        }

        @Test
        @DisplayName("Should allow updating country after construction")
        void testCountryUpdateAfterConstruction() {
            // Arrange
            Customer c = new Customer("Test User", "test@example.com", "SMB", "USA");

            // Act
            c.setCountry("Germany");

            // Assert
            assertEquals("Germany", c.getCountry());
        }

        @Test
        @DisplayName("Should allow setting timestamps manually")
        void testTimestampFields() {
            // Arrange
            LocalDateTime createdAt = LocalDateTime.of(2024, 1, 15, 10, 30, 0);
            LocalDateTime updatedAt = LocalDateTime.of(2024, 6, 20, 14, 45, 0);

            // Act
            customer.setCreatedAt(createdAt);
            customer.setUpdatedAt(updatedAt);

            // Assert
            assertEquals(createdAt, customer.getCreatedAt());
            assertEquals(updatedAt, customer.getUpdatedAt());
        }

        @Test
        @DisplayName("Should allow setting ID")
        void testIdField() {
            // Act
            customer.setId(42L);

            // Assert
            assertEquals(42L, customer.getId());
        }
    }

    @Nested
    @DisplayName("Equals Contract Tests")
    class EqualsContractTests {

        @Test
        @DisplayName("Should be equal to itself (reflexive)")
        void testEqualsReflexive() {
            // Arrange
            customer.setId(1L);

            // Act & Assert
            assertEquals(customer, customer);
        }

        @Test
        @DisplayName("Should be equal when IDs are the same (symmetric)")
        void testEqualsSymmetric() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("Jane Smith", "jane@example.com", "SMB", "Canada");
            customer1.setId(1L);
            customer2.setId(1L);

            // Act & Assert
            assertEquals(customer1, customer2);
            assertEquals(customer2, customer1);
        }

        @Test
        @DisplayName("Should be equal when both have same ID (transitive)")
        void testEqualsTransitive() {
            // Arrange
            Customer customer1 = new Customer("Alice", "alice@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("Bob", "bob@example.com", "SMB", "Canada");
            Customer customer3 = new Customer("Charlie", "charlie@example.com", "Retail", "UK");
            customer1.setId(5L);
            customer2.setId(5L);
            customer3.setId(5L);

            // Act & Assert
            assertEquals(customer1, customer2);
            assertEquals(customer2, customer3);
            assertEquals(customer1, customer3);
        }

        @Test
        @DisplayName("Should not be equal when IDs are different")
        void testNotEqualsWithDifferentIds() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            customer1.setId(1L);
            customer2.setId(2L);

            // Act & Assert
            assertNotEquals(customer1, customer2);
        }

        @Test
        @DisplayName("Should not be equal to null")
        void testNotEqualsToNull() {
            // Arrange
            customer.setId(1L);

            // Act & Assert
            assertNotEquals(null, customer);
            assertFalse(customer.equals(null));
        }

        @Test
        @DisplayName("Should not be equal to different type")
        void testNotEqualsToDifferentType() {
            // Arrange
            customer.setId(1L);

            // Act & Assert
            assertNotEquals(customer, "Not a Customer");
            assertNotEquals(customer, 1L);
        }

        @Test
        @DisplayName("Should be equal when both have null ID")
        void testEqualsWithNullIds() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("Jane Smith", "jane@example.com", "SMB", "Canada");

            // Act & Assert
            assertEquals(customer1, customer2); // Both have null ID
        }
    }

    @Nested
    @DisplayName("HashCode Contract Tests")
    class HashCodeContractTests {

        @Test
        @DisplayName("Should have same hashCode for equal objects")
        void testHashCodeConsistency() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            customer1.setId(1L);
            customer2.setId(1L);

            // Act & Assert
            assertEquals(customer1.hashCode(), customer2.hashCode());
        }

        @Test
        @DisplayName("Should have different hashCode for different IDs")
        void testHashCodeDifferentForDifferentIds() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            customer1.setId(1L);
            customer2.setId(2L);

            // Act & Assert
            assertNotEquals(customer1.hashCode(), customer2.hashCode());
        }

        @Test
        @DisplayName("Should have same hashCode for null IDs")
        void testHashCodeWithNullIds() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("Jane Smith", "jane@example.com", "SMB", "Canada");

            // Act & Assert
            assertEquals(customer1.hashCode(), customer2.hashCode()); // Both have null ID
        }

        @Test
        @DisplayName("Should be usable in HashSet")
        void testHashCodeInHashSet() {
            // Arrange
            Customer customer1 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            Customer customer2 = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
            customer1.setId(1L);
            customer2.setId(1L);

            // Act
            java.util.Set<Customer> set = new java.util.HashSet<>();
            set.add(customer1);
            set.add(customer2);

            // Assert
            assertEquals(1, set.size()); // Should contain only one element since they are equal
        }
    }

    @Nested
    @DisplayName("Getter/Setter Tests")
    class GetterSetterTests {

        @Test
        @DisplayName("Should get and set ID")
        void testIdGetterSetter() {
            // Arrange
            Long id = 99L;

            // Act
            customer.setId(id);

            // Assert
            assertEquals(id, customer.getId());
        }

        @Test
        @DisplayName("Should get and set name")
        void testNameGetterSetter() {
            // Arrange
            String name = "Test Customer";

            // Act
            customer.setName(name);

            // Assert
            assertEquals(name, customer.getName());
        }

        @Test
        @DisplayName("Should get and set email")
        void testEmailGetterSetter() {
            // Arrange
            String email = "test@example.com";

            // Act
            customer.setEmail(email);

            // Assert
            assertEquals(email, customer.getEmail());
        }

        @Test
        @DisplayName("Should get and set segment")
        void testSegmentGetterSetter() {
            // Arrange
            String segment = "Mid-Market";

            // Act
            customer.setSegment(segment);

            // Assert
            assertEquals(segment, customer.getSegment());
        }

        @Test
        @DisplayName("Should get and set country")
        void testCountryGetterSetter() {
            // Arrange
            String country = "France";

            // Act
            customer.setCountry(country);

            // Assert
            assertEquals(country, customer.getCountry());
        }

        @Test
        @DisplayName("Should get and set createdAt")
        void testCreatedAtGetterSetter() {
            // Arrange
            LocalDateTime createdAt = LocalDateTime.now();

            // Act
            customer.setCreatedAt(createdAt);

            // Assert
            assertEquals(createdAt, customer.getCreatedAt());
        }

        @Test
        @DisplayName("Should get and set updatedAt")
        void testUpdatedAtGetterSetter() {
            // Arrange
            LocalDateTime updatedAt = LocalDateTime.now();

            // Act
            customer.setUpdatedAt(updatedAt);

            // Assert
            assertEquals(updatedAt, customer.getUpdatedAt());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("Should include all fields in toString")
        void testToStringIncludesAllFields() {
            // Arrange
            customer.setId(1L);
            customer.setName("John Doe");
            customer.setEmail("john.doe@example.com");
            customer.setSegment("Enterprise");
            customer.setCountry("USA");

            // Act
            String result = customer.toString();

            // Assert
            assertTrue(result.contains("id=1"));
            assertTrue(result.contains("name='John Doe'"));
            assertTrue(result.contains("email='john.doe@example.com'"));
            assertTrue(result.contains("segment='Enterprise'"));
            assertTrue(result.contains("country='USA'"));
        }

        @Test
        @DisplayName("Should handle null values in toString")
        void testToStringWithNullValues() {
            // Act
            String result = customer.toString();

            // Assert
            assertTrue(result.contains("id=null"));
            assertTrue(result.contains("name='null'"));
            assertTrue(result.contains("email='null'"));
            assertTrue(result.contains("segment='null'"));
            assertTrue(result.contains("country='null'"));
        }
    }
}
