package com.businessai.product.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.businessai.product.entity.Product;
import com.businessai.product.exception.ProductNotFoundException;
import com.businessai.product.exception.ProductValidationException;
import com.businessai.product.repository.ProductRepository;

/**
 * Unit tests for ProductService.
 */
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Product validProduct;

    @BeforeEach
    void setUp() {
        validProduct = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
        validProduct.setId(1L);
    }

    // Create Product Tests

    @Test
    void createProduct_WithValidData_ShouldReturnCreatedProduct() {
        // Arrange
        Product newProduct = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));
        when(productRepository.save(any(Product.class))).thenReturn(newProduct);

        // Act
        Product result = productService.createProduct(newProduct);

        // Assert
        assertNotNull(result);
        assertEquals("Mouse", result.getName());
        verify(productRepository, times(1)).save(newProduct);
    }

    @Test
    void createProduct_WithNullProduct_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(ProductValidationException.class, () -> productService.createProduct(null));
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithNullName_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product(null, "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product name is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithEmptyName_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("   ", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product name is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithNullCategory_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("Laptop", null, new BigDecimal("500.00"), new BigDecimal("800.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product category is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithEmptyCategory_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("Laptop", "  ", new BigDecimal("500.00"), new BigDecimal("800.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product category is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithNullCost_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("Laptop", "Electronics", null, new BigDecimal("800.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product cost is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithNegativeCost_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("Laptop", "Electronics", new BigDecimal("-10.00"), new BigDecimal("800.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product cost must be greater than or equal to 0", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithZeroCost_ShouldSucceed() {
        // Arrange
        Product product = new Product("Free Item", "Promotional", BigDecimal.ZERO, new BigDecimal("0.00"));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        // Act
        Product result = productService.createProduct(product);

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getCost());
        verify(productRepository, times(1)).save(product);
    }

    @Test
    void createProduct_WithNullPrice_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("Laptop", "Electronics", new BigDecimal("500.00"), null);

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product price is required", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithNegativePrice_ShouldThrowValidationException() {
        // Arrange
        Product product = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("-100.00"));

        // Act & Assert
        ProductValidationException exception = assertThrows(
            ProductValidationException.class,
            () -> productService.createProduct(product)
        );
        assertEquals("Product price must be greater than or equal to 0", exception.getMessage());
        verify(productRepository, never()).save(any());
    }

    @Test
    void createProduct_WithZeroPrice_ShouldSucceed() {
        // Arrange
        Product product = new Product("Free Item", "Promotional", BigDecimal.ZERO, BigDecimal.ZERO);
        when(productRepository.save(any(Product.class))).thenReturn(product);

        // Act
        Product result = productService.createProduct(product);

        // Assert
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getPrice());
        verify(productRepository, times(1)).save(product);
    }

    // Get Product Tests

    @Test
    void getProductById_WithExistingId_ShouldReturnProduct() {
        // Arrange
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));

        // Act
        Product result = productService.getProductById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Laptop", result.getName());
        verify(productRepository, times(1)).findById(1L);
    }

    @Test
    void getProductById_WithNonExistingId_ShouldThrowNotFoundException() {
        // Arrange
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        ProductNotFoundException exception = assertThrows(
            ProductNotFoundException.class,
            () -> productService.getProductById(999L)
        );
        assertEquals("Product not found with id: 999", exception.getMessage());
        verify(productRepository, times(1)).findById(999L);
    }

    @Test
    void getAllProducts_ShouldReturnAllProducts() {
        // Arrange
        Product product2 = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));
        product2.setId(2L);
        List<Product> products = Arrays.asList(validProduct, product2);
        when(productRepository.findAll()).thenReturn(products);

        // Act
        List<Product> result = productService.getAllProducts();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    void getProductsByCategory_WithValidCategory_ShouldReturnProducts() {
        // Arrange
        List<Product> products = Arrays.asList(validProduct);
        when(productRepository.findByCategory("Electronics")).thenReturn(products);

        // Act
        List<Product> result = productService.getProductsByCategory("Electronics");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Electronics", result.get(0).getCategory());
        verify(productRepository, times(1)).findByCategory("Electronics");
    }

    @Test
    void getProductsByCategory_WithNullCategory_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(ProductValidationException.class, () -> productService.getProductsByCategory(null));
        verify(productRepository, never()).findByCategory(any());
    }

    @Test
    void getProductsByCategory_WithEmptyCategory_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(ProductValidationException.class, () -> productService.getProductsByCategory("  "));
        verify(productRepository, never()).findByCategory(any());
    }

    @Test
    void searchProductsByName_WithValidName_ShouldReturnProducts() {
        // Arrange
        List<Product> products = Arrays.asList(validProduct);
        when(productRepository.findByNameContainingIgnoreCase("Lap")).thenReturn(products);

        // Act
        List<Product> result = productService.searchProductsByName("Lap");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(productRepository, times(1)).findByNameContainingIgnoreCase("Lap");
    }

    @Test
    void searchProductsByName_WithNullName_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(ProductValidationException.class, () -> productService.searchProductsByName(null));
        verify(productRepository, never()).findByNameContainingIgnoreCase(any());
    }

    @Test
    void searchProductsByName_WithEmptyName_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(ProductValidationException.class, () -> productService.searchProductsByName("  "));
        verify(productRepository, never()).findByNameContainingIgnoreCase(any());
    }

    // Update Product Tests

    @Test
    void updateProduct_WithValidData_ShouldReturnUpdatedProduct() {
        // Arrange
        Product updatedData = new Product("Updated Laptop", "Electronics", new BigDecimal("600.00"), new BigDecimal("900.00"));
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
        when(productRepository.save(any(Product.class))).thenReturn(validProduct);

        // Act
        Product result = productService.updateProduct(1L, updatedData);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Laptop", result.getName());
        assertEquals(new BigDecimal("600.00"), result.getCost());
        assertEquals(new BigDecimal("900.00"), result.getPrice());
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, times(1)).save(validProduct);
    }

    @Test
    void updateProduct_WithNonExistingId_ShouldThrowNotFoundException() {
        // Arrange
        Product updatedData = new Product("Updated Laptop", "Electronics", new BigDecimal("600.00"), new BigDecimal("900.00"));
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ProductNotFoundException.class, () -> productService.updateProduct(999L, updatedData));
        verify(productRepository, times(1)).findById(999L);
        verify(productRepository, never()).save(any());
    }

    @Test
    void updateProduct_WithInvalidData_ShouldThrowValidationException() {
        // Arrange
        Product invalidData = new Product(null, "Electronics", new BigDecimal("600.00"), new BigDecimal("900.00"));
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));

        // Act & Assert
        assertThrows(ProductValidationException.class, () -> productService.updateProduct(1L, invalidData));
        verify(productRepository, times(1)).findById(1L);
        verify(productRepository, never()).save(any());
    }

    // Delete Product Tests

    @Test
    void deleteProduct_WithExistingId_ShouldDeleteProduct() {
        // Arrange
        when(productRepository.existsById(1L)).thenReturn(true);
        doNothing().when(productRepository).deleteById(1L);

        // Act
        productService.deleteProduct(1L);

        // Assert
        verify(productRepository, times(1)).existsById(1L);
        verify(productRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteProduct_WithNonExistingId_ShouldThrowNotFoundException() {
        // Arrange
        when(productRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        ProductNotFoundException exception = assertThrows(
            ProductNotFoundException.class,
            () -> productService.deleteProduct(999L)
        );
        assertEquals("Product not found with id: 999", exception.getMessage());
        verify(productRepository, times(1)).existsById(999L);
        verify(productRepository, never()).deleteById(any());
    }

    // Exists Tests

    @Test
    void existsById_WithExistingId_ShouldReturnTrue() {
        // Arrange
        when(productRepository.existsById(1L)).thenReturn(true);

        // Act
        boolean result = productService.existsById(1L);

        // Assert
        assertTrue(result);
        verify(productRepository, times(1)).existsById(1L);
    }

    @Test
    void existsById_WithNonExistingId_ShouldReturnFalse() {
        // Arrange
        when(productRepository.existsById(999L)).thenReturn(false);

        // Act
        boolean result = productService.existsById(999L);

        // Assert
        assertFalse(result);
        verify(productRepository, times(1)).existsById(999L);
    }

    @Test
    void existsByName_WithExistingName_ShouldReturnTrue() {
        // Arrange
        when(productRepository.existsByName("Laptop")).thenReturn(true);

        // Act
        boolean result = productService.existsByName("Laptop");

        // Assert
        assertTrue(result);
        verify(productRepository, times(1)).existsByName("Laptop");
    }

    @Test
    void existsByName_WithNonExistingName_ShouldReturnFalse() {
        // Arrange
        when(productRepository.existsByName("NonExistent")).thenReturn(false);

        // Act
        boolean result = productService.existsByName("NonExistent");

        // Assert
        assertFalse(result);
        verify(productRepository, times(1)).existsByName("NonExistent");
    }
}
