package com.businessai.product.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;

import org.mockito.MockitoAnnotations;

import com.businessai.product.entity.Product;
import com.businessai.product.exception.ProductValidationException;
import com.businessai.product.repository.ProductRepository;

import net.jqwik.api.*;
import net.jqwik.api.lifecycle.BeforeTry;

/**
 * Property-based tests for Product validation.
 * 
 * **Validates: Requirements 1.2**
 */
class ProductValidationProperties {

    private ProductRepository productRepository;
    private ProductService productService;

    @BeforeTry
    void setUp() {
        // Initialize mocks before each property test try
        productRepository = mock(ProductRepository.class);
        productService = new ProductService(productRepository);
    }

    /**
     * Property 1: Product Validation Rejects Invalid Data
     * 
     * **Validates: Requirements 1.2**
     * 
     * For any product creation request with missing or invalid required fields
     * (name, category, cost, price), the Product Service SHALL reject the request
     * and return a validation error.
     */
    @Property
    @Label("Product validation rejects products with null or empty names")
    void productValidation_rejectsNullOrEmptyNames(@ForAll("nullOrEmptyStrings") String invalidName) {
        // Arrange
        Product product = new Product(invalidName, "Electronics", new BigDecimal("100.00"), new BigDecimal("150.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        
        assertEquals("Product name is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation rejects products with null or empty categories")
    void productValidation_rejectsNullOrEmptyCategories(@ForAll("nullOrEmptyStrings") String invalidCategory) {
        // Arrange
        Product product = new Product("Laptop", invalidCategory, new BigDecimal("100.00"), new BigDecimal("150.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        
        assertEquals("Product category is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation rejects products with null cost")
    void productValidation_rejectsNullCost(@ForAll("validProductNames") String name,
                                           @ForAll("validCategories") String category,
                                           @ForAll("validPrices") BigDecimal price) {
        // Arrange
        Product product = new Product(name, category, null, price);

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        
        assertEquals("Product cost is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation rejects products with negative cost")
    void productValidation_rejectsNegativeCost(@ForAll("validProductNames") String name,
                                               @ForAll("validCategories") String category,
                                               @ForAll("negativePrices") BigDecimal negativeCost,
                                               @ForAll("validPrices") BigDecimal price) {
        // Arrange
        Product product = new Product(name, category, negativeCost, price);

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        
        assertEquals("Product cost must be greater than or equal to 0", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation rejects products with null price")
    void productValidation_rejectsNullPrice(@ForAll("validProductNames") String name,
                                            @ForAll("validCategories") String category,
                                            @ForAll("validPrices") BigDecimal cost) {
        // Arrange
        Product product = new Product(name, category, cost, null);

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        
        assertEquals("Product price is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation rejects products with negative price")
    void productValidation_rejectsNegativePrice(@ForAll("validProductNames") String name,
                                                @ForAll("validCategories") String category,
                                                @ForAll("validPrices") BigDecimal cost,
                                                @ForAll("negativePrices") BigDecimal negativePrice) {
        // Arrange
        Product product = new Product(name, category, cost, negativePrice);

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        
        assertEquals("Product price must be greater than or equal to 0", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation rejects null product")
    void productValidation_rejectsNullProduct() {
        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(null)
        );
        
        assertEquals("Product cannot be null", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Property
    @Label("Product validation accepts valid products")
    void productValidation_acceptsValidProducts(@ForAll("validProductNames") String name,
                                                @ForAll("validCategories") String category,
                                                @ForAll("validPrices") BigDecimal cost,
                                                @ForAll("validPrices") BigDecimal price) {
        // Arrange
        Product product = new Product(name, category, cost, price);
        Product savedProduct = new Product(name, category, cost, price);
        savedProduct.setId(1L);
        
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        // Act
        Product result = productService.createProduct(product);

        // Assert
        assertNotNull(result);
        assertEquals(name, result.getName());
        assertEquals(category, result.getCategory());
        assertEquals(cost, result.getCost());
        assertEquals(price, result.getPrice());
        verify(productRepository, times(1)).save(product);
    }

    // Arbitraries (Generators)

    @Provide
    Arbitrary<String> nullOrEmptyStrings() {
        return Arbitraries.oneOf(
            Arbitraries.just(null),
            Arbitraries.just(""),
            Arbitraries.just("   "),
            Arbitraries.just("\t"),
            Arbitraries.just("\n")
        );
    }

    @Provide
    Arbitrary<String> validProductNames() {
        return Arbitraries.oneOf(
            Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(50),
            Arbitraries.of("Laptop", "Mouse", "Keyboard", "Monitor", "Desk", "Chair", "Phone", "Tablet")
        );
    }

    @Provide
    Arbitrary<String> validCategories() {
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

    @Provide
    Arbitrary<BigDecimal> validPrices() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.ZERO, new BigDecimal("10000.00"))
            .ofScale(2);
    }

    @Provide
    Arbitrary<BigDecimal> negativePrices() {
        return Arbitraries.bigDecimals()
            .between(new BigDecimal("-10000.00"), new BigDecimal("-0.01"))
            .ofScale(2);
    }
}
