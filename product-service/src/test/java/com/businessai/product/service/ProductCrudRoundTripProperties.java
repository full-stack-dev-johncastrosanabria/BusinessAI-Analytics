package com.businessai.product.service;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.businessai.product.entity.Product;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;

/**
 * Property-based tests for Product CRUD round-trip operations.
 * Uses jqwik with Spring Boot Test integration.
 * 
 * **Validates: Requirements 1.3, 1.4**
 */
@SpringBootTest
@ActiveProfiles("test")
class ProductCrudRoundTripProperties {

    @Autowired
    private ProductService productService;

    /**
     * Property 2: Product CRUD Round-Trip Preserves Data
     * 
     * **Validates: Requirements 1.3, 1.4**
     * 
     * For any valid product, creating the product, then retrieving it SHALL return
     * data that matches the original product data.
     */
    @Test
    void createRetrieveRoundTrip_preservesProductData() {
        // Use jqwik's Arbitrary API to generate test data programmatically
        Arbitrary<String> names = validProductNames();
        Arbitrary<String> categories = validCategories();
        Arbitrary<BigDecimal> prices = validPrices();
        
        // Run property test manually with 100 tries
        for (int i = 0; i < 100; i++) {
            String name = names.sample();
            String category = categories.sample();
            BigDecimal cost = prices.sample();
            BigDecimal price = prices.sample();
            
            // Arrange - Create a product with generated valid data
            Product originalProduct = new Product(name, category, cost, price);

            // Act - Create the product
            Product createdProduct = productService.createProduct(originalProduct);
            assertNotNull(createdProduct.getId(), "Created product should have an ID");

            // Act - Retrieve the product
            Product retrievedProduct = productService.getProductById(createdProduct.getId());

            // Assert - Retrieved product matches original data
            assertNotNull(retrievedProduct, "Retrieved product should not be null");
            assertEquals(createdProduct.getId(), retrievedProduct.getId(), "IDs should match");
            assertEquals(name, retrievedProduct.getName(), "Names should match");
            assertEquals(category, retrievedProduct.getCategory(), "Categories should match");
            assertEquals(0, cost.compareTo(retrievedProduct.getCost()), "Costs should match");
            assertEquals(0, price.compareTo(retrievedProduct.getPrice()), "Prices should match");
            assertNotNull(retrievedProduct.getCreatedAt(), "Created timestamp should be set");
            assertNotNull(retrievedProduct.getUpdatedAt(), "Updated timestamp should be set");
            
            // Cleanup
            productService.deleteProduct(createdProduct.getId());
        }
    }

    /**
     * Property 2: Product CRUD Round-Trip Preserves Data (Update variant)
     * 
     * **Validates: Requirements 1.3, 1.4**
     * 
     * For any valid product, creating a product, updating it with new valid data,
     * then retrieving it SHALL return the updated data.
     */
    @Test
    void createUpdateRetrieveRoundTrip_preservesUpdatedData() {
        // Use jqwik's Arbitrary API to generate test data programmatically
        Arbitrary<String> names = validProductNames();
        Arbitrary<String> categories = validCategories();
        Arbitrary<BigDecimal> prices = validPrices();
        
        // Run property test manually with 100 tries
        for (int i = 0; i < 100; i++) {
            String originalName = names.sample();
            String originalCategory = categories.sample();
            BigDecimal originalCost = prices.sample();
            BigDecimal originalPrice = prices.sample();
            
            String updatedName = names.sample();
            String updatedCategory = categories.sample();
            BigDecimal updatedCost = prices.sample();
            BigDecimal updatedPrice = prices.sample();
            
            // Arrange - Create a product with original data
            Product originalProduct = new Product(originalName, originalCategory, originalCost, originalPrice);

            // Act - Create the product
            Product createdProduct = productService.createProduct(originalProduct);
            assertNotNull(createdProduct.getId(), "Created product should have an ID");
            Long productId = createdProduct.getId();

            // Arrange - Prepare updated product data
            Product updatedProduct = new Product(updatedName, updatedCategory, updatedCost, updatedPrice);

            // Act - Update the product
            Product resultAfterUpdate = productService.updateProduct(productId, updatedProduct);

            // Act - Retrieve the product
            Product retrievedProduct = productService.getProductById(productId);

            // Assert - Retrieved product matches updated data
            assertNotNull(retrievedProduct, "Retrieved product should not be null");
            assertEquals(productId, retrievedProduct.getId(), "ID should remain the same");
            assertEquals(updatedName, retrievedProduct.getName(), "Name should be updated");
            assertEquals(updatedCategory, retrievedProduct.getCategory(), "Category should be updated");
            assertEquals(0, updatedCost.compareTo(retrievedProduct.getCost()), "Cost should be updated");
            assertEquals(0, updatedPrice.compareTo(retrievedProduct.getPrice()), "Price should be updated");
            
            // Assert - Update result also matches
            assertEquals(updatedName, resultAfterUpdate.getName(), "Update result should have updated name");
            assertEquals(updatedCategory, resultAfterUpdate.getCategory(), "Update result should have updated category");
            assertEquals(0, updatedCost.compareTo(resultAfterUpdate.getCost()), "Update result should have updated cost");
            assertEquals(0, updatedPrice.compareTo(resultAfterUpdate.getPrice()), "Update result should have updated price");
            
            // Cleanup
            productService.deleteProduct(productId);
        }
    }

    // Arbitraries (Generators)

    private Arbitrary<String> validProductNames() {
        return Arbitraries.oneOf(
            Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(50),
            Arbitraries.of("Laptop", "Mouse", "Keyboard", "Monitor", "Desk", "Chair", "Phone", "Tablet", 
                          "Headphones", "Webcam", "Printer", "Scanner", "Router", "Switch", "Cable")
        );
    }

    private Arbitrary<String> validCategories() {
        return Arbitraries.of(
            "Electronics",
            "Furniture",
            "Office Supplies",
            "Accessories",
            "Software",
            "Hardware",
            "Clothing",
            "Food & Beverage"
        );
    }

    private Arbitrary<BigDecimal> validPrices() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.ZERO, new BigDecimal("10000.00"))
            .ofScale(2);
    }
}
