package com.businessai.product.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Product entity.
 */
class ProductTest {

    @Test
    void testProductConstructorAndGetters() {
        // Arrange
        String name = "Laptop";
        String category = "Electronics";
        BigDecimal cost = new BigDecimal("500.00");
        BigDecimal price = new BigDecimal("800.00");

        // Act
        Product product = new Product(name, category, cost, price);

        // Assert
        assertNull(product.getId());
        assertEquals(name, product.getName());
        assertEquals(category, product.getCategory());
        assertEquals(cost, product.getCost());
        assertEquals(price, product.getPrice());
        assertNull(product.getCreatedAt());
        assertNull(product.getUpdatedAt());
    }

    @Test
    void testProductSetters() {
        // Arrange
        Product product = new Product();

        // Act
        product.setName("Mouse");
        product.setCategory("Accessories");
        product.setCost(new BigDecimal("10.00"));
        product.setPrice(new BigDecimal("25.00"));

        // Assert
        assertEquals("Mouse", product.getName());
        assertEquals("Accessories", product.getCategory());
        assertEquals(new BigDecimal("10.00"), product.getCost());
        assertEquals(new BigDecimal("25.00"), product.getPrice());
    }

    @Test
    void testProductEquality() {
        // Arrange
        Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
        Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
        Product product3 = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));

        // Act & Assert
        assertEquals(product1, product1); // Same instance
        assertEquals(product1, product2); // Both have null ID, so they are equal
        assertEquals(product2, product3); // Both have null ID, so they are equal

        // Set same ID
        product1.setId(1L);
        product2.setId(1L);
        assertEquals(product1, product2); // Same ID

        // Different ID
        product3.setId(2L);
        assertNotEquals(product1, product3);
    }

    @Test
    void testProductHashCode() {
        // Arrange
        Product product1 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
        Product product2 = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));

        // Act & Assert
        assertEquals(product1.hashCode(), product2.hashCode()); // Both have null ID, so same hashCode

        // Set same ID
        product1.setId(1L);
        product2.setId(1L);
        assertEquals(product1.hashCode(), product2.hashCode()); // Same ID
    }

    @Test
    void testProductToString() {
        // Arrange
        Product product = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
        product.setId(1L);

        // Act
        String result = product.toString();

        // Assert
        assertTrue(result.contains("id=1"));
        assertTrue(result.contains("name='Laptop'"));
        assertTrue(result.contains("category='Electronics'"));
        assertTrue(result.contains("cost=500.00"));
        assertTrue(result.contains("price=800.00"));
    }
}
