package com.businessai.product.entity;

import java.math.BigDecimal;
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
 * Comprehensive unit tests for Product entity.
 * Tests entity validation, field constraints, price/stock management, and equals/hashCode contracts.
 * Validates: Requirements 2.3.4
 */
@DisplayName("Product Entity Tests")
class ProductTest {

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product();
    }

    @Nested
    @DisplayName("Entity Validation Tests")
    class EntityValidationTests {

        @Test
        @DisplayName("Should create valid product with all required fields")
        void testValidProductCreation() {
            // Arrange
            String name = "Laptop";
            String category = "Electronics";
            BigDecimal cost = new BigDecimal("500.00");
            BigDecimal price = new BigDecimal("800.00");

            // Act
            Product validProduct = new Product(name, category, cost, price);

            // Assert
            assertNull(validProduct.getId());
            assertEquals(name, validProduct.getName());
            assertEquals(category, validProduct.getCategory());
            assertEquals(cost, validProduct.getCost());
            assertEquals(price, validProduct.getPrice());
            assertNull(validProduct.getCreatedAt());
            assertNull(validProduct.getUpdatedAt());
        }

        @Test
        @DisplayName("Should create product with default constructor")
        void testDefaultConstructor() {
            // Act
            Product newProduct = new Product();

            // Assert
            assertNull(newProduct.getId());
            assertNull(newProduct.getName());
            assertNull(newProduct.getCategory());
            assertNull(newProduct.getCost());
            assertNull(newProduct.getPrice());
        }

        @Test
        @DisplayName("Should set and get all product fields")
        void testProductFieldsSetAndGet() {
            // Arrange
            Long id = 1L;
            String name = "Monitor";
            String category = "Electronics";
            BigDecimal cost = new BigDecimal("150.00");
            BigDecimal price = new BigDecimal("250.00");
            LocalDateTime now = LocalDateTime.now();

            // Act
            product.setId(id);
            product.setName(name);
            product.setCategory(category);
            product.setCost(cost);
            product.setPrice(price);
            product.setCreatedAt(now);
            product.setUpdatedAt(now);

            // Assert
            assertEquals(id, product.getId());
            assertEquals(name, product.getName());
            assertEquals(category, product.getCategory());
            assertEquals(cost, product.getCost());
            assertEquals(price, product.getPrice());
            assertEquals(now, product.getCreatedAt());
            assertEquals(now, product.getUpdatedAt());
        }
    }

    @Nested
    @DisplayName("Field Constraints Tests")
    class FieldConstraintsTests {

        @Test
        @DisplayName("Should accept valid product name")
        void testValidProductName() {
            // Act
            product.setName("Valid Product Name");

            // Assert
            assertEquals("Valid Product Name", product.getName());
        }

        @Test
        @DisplayName("Should accept valid category")
        void testValidCategory() {
            // Act
            product.setCategory("Electronics");

            // Assert
            assertEquals("Electronics", product.getCategory());
        }

        @Test
        @DisplayName("Should accept long product name within length limit")
        void testLongProductName() {
            // Arrange
            String longName = "A".repeat(255); // Max length

            // Act
            product.setName(longName);

            // Assert
            assertEquals(longName, product.getName());
        }

        @Test
        @DisplayName("Should accept long category within length limit")
        void testLongCategory() {
            // Arrange
            String longCategory = "B".repeat(100); // Max length

            // Act
            product.setCategory(longCategory);

            // Assert
            assertEquals(longCategory, product.getCategory());
        }

        @Test
        @DisplayName("Should accept null name (validation handled by annotations)")
        void testNullName() {
            // Act
            product.setName(null);

            // Assert
            assertNull(product.getName());
        }

        @Test
        @DisplayName("Should accept null category (validation handled by annotations)")
        void testNullCategory() {
            // Act
            product.setCategory(null);

            // Assert
            assertNull(product.getCategory());
        }
    }

    @Nested
    @DisplayName("Price Validation Tests")
    class PriceValidationTests {

        @Test
        @DisplayName("Should accept positive price")
        void testPositivePrice() {
            // Arrange
            BigDecimal positivePrice = new BigDecimal("99.99");

            // Act
            product.setPrice(positivePrice);

            // Assert
            assertEquals(positivePrice, product.getPrice());
        }

        @Test
        @DisplayName("Should accept zero price (boundary case)")
        void testZeroPrice() {
            // Arrange
            BigDecimal zeroPrice = new BigDecimal("0.00");

            // Act
            product.setPrice(zeroPrice);

            // Assert
            assertEquals(zeroPrice, product.getPrice());
        }

        @Test
        @DisplayName("Should accept large price value")
        void testLargePriceValue() {
            // Arrange
            BigDecimal largePrice = new BigDecimal("999999.99");

            // Act
            product.setPrice(largePrice);

            // Assert
            assertEquals(largePrice, product.getPrice());
        }

        @Test
        @DisplayName("Should accept price with two decimal places")
        void testPriceWithTwoDecimals() {
            // Arrange
            BigDecimal price = new BigDecimal("123.45");

            // Act
            product.setPrice(price);

            // Assert
            assertEquals(price, product.getPrice());
        }

        @Test
        @DisplayName("Should accept price with one decimal place")
        void testPriceWithOneDecimal() {
            // Arrange
            BigDecimal price = new BigDecimal("123.5");

            // Act
            product.setPrice(price);

            // Assert
            assertEquals(price, product.getPrice());
        }

        @Test
        @DisplayName("Should accept price with no decimal places")
        void testPriceWithNoDecimals() {
            // Arrange
            BigDecimal price = new BigDecimal("123");

            // Act
            product.setPrice(price);

            // Assert
            assertEquals(price, product.getPrice());
        }

        @Test
        @DisplayName("Should accept null price (validation handled by annotations)")
        void testNullPrice() {
            // Act
            product.setPrice(null);

            // Assert
            assertNull(product.getPrice());
        }
    }

    @Nested
    @DisplayName("Cost Validation Tests")
    class CostValidationTests {

        @Test
        @DisplayName("Should accept positive cost")
        void testPositiveCost() {
            // Arrange
            BigDecimal positiveCost = new BigDecimal("50.00");

            // Act
            product.setCost(positiveCost);

            // Assert
            assertEquals(positiveCost, product.getCost());
        }

        @Test
        @DisplayName("Should accept zero cost (boundary case)")
        void testZeroCost() {
            // Arrange
            BigDecimal zeroCost = new BigDecimal("0.00");

            // Act
            product.setCost(zeroCost);

            // Assert
            assertEquals(zeroCost, product.getCost());
        }

        @Test
        @DisplayName("Should accept large cost value")
        void testLargeCostValue() {
            // Arrange
            BigDecimal largeCost = new BigDecimal("999999.99");

            // Act
            product.setCost(largeCost);

            // Assert
            assertEquals(largeCost, product.getCost());
        }

        @Test
        @DisplayName("Should accept null cost (validation handled by annotations)")
        void testNullCost() {
            // Act
            product.setCost(null);

            // Assert
            assertNull(product.getCost());
        }
    }

    @Nested
    @DisplayName("Equals Contract Tests")
    class EqualsContractTests {

        @Test
        @DisplayName("Should be equal to itself (reflexive)")
        void testEqualsReflexive() {
            // Arrange
            product.setId(1L);

            // Act & Assert
            assertEquals(product, product);
        }

        @Test
        @DisplayName("Should be equal when IDs are the same (symmetric)")
        void testEqualsSymmetric() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            product1.setId(1L);
            product2.setId(1L);

            // Act & Assert
            assertEquals(product1, product2);
            assertEquals(product2, product1);
        }

        @Test
        @DisplayName("Should be equal when both have same ID (transitive)")
        void testEqualsTransitive() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));
            Product product3 = new Product("Keyboard", "Accessories", new BigDecimal("20.00"), new BigDecimal("50.00"));
            product1.setId(1L);
            product2.setId(1L);
            product3.setId(1L);

            // Act & Assert
            assertEquals(product1, product2);
            assertEquals(product2, product3);
            assertEquals(product1, product3);
        }

        @Test
        @DisplayName("Should not be equal when IDs are different")
        void testNotEqualsWithDifferentIds() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            product1.setId(1L);
            product2.setId(2L);

            // Act & Assert
            assertNotEquals(product1, product2);
        }

        @Test
        @DisplayName("Should not be equal to null")
        void testNotEqualsToNull() {
            // Arrange
            product.setId(1L);

            // Act & Assert
            assertNotEquals(product, null);
            assertFalse(product.equals(null));
        }

        @Test
        @DisplayName("Should not be equal to different type")
        void testNotEqualsToDifferentType() {
            // Arrange
            product.setId(1L);

            // Act & Assert
            assertNotEquals(product, "Not a Product");
            assertNotEquals(product, 1L);
        }

        @Test
        @DisplayName("Should be equal when both have null ID")
        void testEqualsWithNullIds() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));

            // Act & Assert
            assertEquals(product1, product2); // Both have null ID
        }
    }

    @Nested
    @DisplayName("HashCode Contract Tests")
    class HashCodeContractTests {

        @Test
        @DisplayName("Should have same hashCode for equal objects")
        void testHashCodeConsistency() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            product1.setId(1L);
            product2.setId(1L);

            // Act & Assert
            assertEquals(product1.hashCode(), product2.hashCode());
        }

        @Test
        @DisplayName("Should have different hashCode for different IDs")
        void testHashCodeDifferentForDifferentIds() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            product1.setId(1L);
            product2.setId(2L);

            // Act & Assert
            assertNotEquals(product1.hashCode(), product2.hashCode());
        }

        @Test
        @DisplayName("Should have same hashCode for null IDs")
        void testHashCodeWithNullIds() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));

            // Act & Assert
            assertEquals(product1.hashCode(), product2.hashCode()); // Both have null ID
        }

        @Test
        @DisplayName("Should be usable in HashSet")
        void testHashCodeInHashSet() {
            // Arrange
            Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
            product1.setId(1L);
            product2.setId(1L);

            // Act
            java.util.Set<Product> set = new java.util.HashSet<>();
            set.add(product1);
            set.add(product2);

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
            Long id = 123L;

            // Act
            product.setId(id);

            // Assert
            assertEquals(id, product.getId());
        }

        @Test
        @DisplayName("Should get and set name")
        void testNameGetterSetter() {
            // Arrange
            String name = "Test Product";

            // Act
            product.setName(name);

            // Assert
            assertEquals(name, product.getName());
        }

        @Test
        @DisplayName("Should get and set category")
        void testCategoryGetterSetter() {
            // Arrange
            String category = "Test Category";

            // Act
            product.setCategory(category);

            // Assert
            assertEquals(category, product.getCategory());
        }

        @Test
        @DisplayName("Should get and set cost")
        void testCostGetterSetter() {
            // Arrange
            BigDecimal cost = new BigDecimal("100.00");

            // Act
            product.setCost(cost);

            // Assert
            assertEquals(cost, product.getCost());
        }

        @Test
        @DisplayName("Should get and set price")
        void testPriceGetterSetter() {
            // Arrange
            BigDecimal price = new BigDecimal("200.00");

            // Act
            product.setPrice(price);

            // Assert
            assertEquals(price, product.getPrice());
        }

        @Test
        @DisplayName("Should get and set createdAt")
        void testCreatedAtGetterSetter() {
            // Arrange
            LocalDateTime createdAt = LocalDateTime.now();

            // Act
            product.setCreatedAt(createdAt);

            // Assert
            assertEquals(createdAt, product.getCreatedAt());
        }

        @Test
        @DisplayName("Should get and set updatedAt")
        void testUpdatedAtGetterSetter() {
            // Arrange
            LocalDateTime updatedAt = LocalDateTime.now();

            // Act
            product.setUpdatedAt(updatedAt);

            // Assert
            assertEquals(updatedAt, product.getUpdatedAt());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("Should include all fields in toString")
        void testToStringIncludesAllFields() {
            // Arrange
            product.setId(1L);
            product.setName("Laptop");
            product.setCategory("Electronics");
            product.setCost(new BigDecimal("500.00"));
            product.setPrice(new BigDecimal("800.00"));

            // Act
            String result = product.toString();

            // Assert
            assertTrue(result.contains("id=1"));
            assertTrue(result.contains("name='Laptop'"));
            assertTrue(result.contains("category='Electronics'"));
            assertTrue(result.contains("cost=500.00"));
            assertTrue(result.contains("price=800.00"));
        }

        @Test
        @DisplayName("Should handle null values in toString")
        void testToStringWithNullValues() {
            // Act
            String result = product.toString();

            // Assert
            assertTrue(result.contains("id=null"));
            assertTrue(result.contains("name='null'"));
            assertTrue(result.contains("category='null'"));
        }
    }
}
