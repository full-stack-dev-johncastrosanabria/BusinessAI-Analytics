package com.businessai.product.controller;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.businessai.product.entity.Product;
import com.businessai.product.exception.ProductNotFoundException;
import com.businessai.product.exception.ProductValidationException;
import com.businessai.product.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests for ProductController using MockMvc.
 * Tests all CRUD operations, validation errors, and 404 responses.
 */
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    private Product validProduct;

    @BeforeEach
    void setUp() {
        validProduct = new Product("Laptop", "Electronics", new BigDecimal("500.00"), new BigDecimal("800.00"));
        validProduct.setId(1L);
    }

    // CREATE Product Tests

    @Test
    void createProduct_WithValidData_ShouldReturn201AndProduct() throws Exception {
        // Arrange
        Product newProduct = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));
        newProduct.setId(2L);
        when(productService.createProduct(any(Product.class))).thenReturn(newProduct);

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newProduct)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Mouse"))
                .andExpect(jsonPath("$.category").value("Accessories"))
                .andExpect(jsonPath("$.cost").value(10.00))
                .andExpect(jsonPath("$.price").value(25.00));

        verify(productService, times(1)).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithMissingName_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "category": "Electronics",
                    "cost": 500.00,
                    "price": 800.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed for product"))
                .andExpect(jsonPath("$.details.name").exists());

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithBlankName_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "   ",
                    "category": "Electronics",
                    "cost": 500.00,
                    "price": 800.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithMissingCategory_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "Laptop",
                    "cost": 500.00,
                    "price": 800.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.category").exists());

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithNullCost_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "Laptop",
                    "category": "Electronics",
                    "price": 800.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.cost").exists());

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithNegativeCost_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "Laptop",
                    "category": "Electronics",
                    "cost": -10.00,
                    "price": 800.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.cost").exists());

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithNullPrice_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "Laptop",
                    "category": "Electronics",
                    "cost": 500.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.price").exists());

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithNegativePrice_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "Laptop",
                    "category": "Electronics",
                    "cost": 500.00,
                    "price": -100.00
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.price").exists());

        verify(productService, never()).createProduct(any(Product.class));
    }

    @Test
    void createProduct_WithServiceValidationException_ShouldReturn400() throws Exception {
        // Arrange
        Product newProduct = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));
        when(productService.createProduct(any(Product.class)))
                .thenThrow(new ProductValidationException("Custom validation error"));

        // Act & Assert
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newProduct)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Custom validation error"));

        verify(productService, times(1)).createProduct(any(Product.class));
    }

    // GET Product by ID Tests

    @Test
    void getProductById_WithExistingId_ShouldReturn200AndProduct() throws Exception {
        // Arrange
        when(productService.getProductById(1L)).thenReturn(validProduct);

        // Act & Assert
        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Laptop"))
                .andExpect(jsonPath("$.category").value("Electronics"))
                .andExpect(jsonPath("$.cost").value(500.00))
                .andExpect(jsonPath("$.price").value(800.00));

        verify(productService, times(1)).getProductById(1L);
    }

    @Test
    void getProductById_WithNonExistingId_ShouldReturn404() throws Exception {
        // Arrange
        when(productService.getProductById(999L))
                .thenThrow(new ProductNotFoundException("Product not found with id: 999"));

        // Act & Assert
        mockMvc.perform(get("/api/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Product not found with id: 999"));

        verify(productService, times(1)).getProductById(999L);
    }

    // GET All Products Tests

    @Test
    void getAllProducts_ShouldReturn200AndProductList() throws Exception {
        // Arrange
        Product product2 = new Product("Mouse", "Accessories", new BigDecimal("10.00"), new BigDecimal("25.00"));
        product2.setId(2L);
        List<Product> products = Arrays.asList(validProduct, product2);
        when(productService.getAllProducts()).thenReturn(products);

        // Act & Assert
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Laptop"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("Mouse"));

        verify(productService, times(1)).getAllProducts();
    }

    @Test
    void getAllProducts_WithEmptyList_ShouldReturn200AndEmptyArray() throws Exception {
        // Arrange
        when(productService.getAllProducts()).thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(productService, times(1)).getAllProducts();
    }

    // UPDATE Product Tests

    @Test
    void updateProduct_WithValidData_ShouldReturn200AndUpdatedProduct() throws Exception {
        // Arrange
        Product updatedProduct = new Product("Updated Laptop", "Electronics", new BigDecimal("600.00"), new BigDecimal("900.00"));
        updatedProduct.setId(1L);
        when(productService.updateProduct(eq(1L), any(Product.class))).thenReturn(updatedProduct);

        // Act & Assert
        mockMvc.perform(put("/api/products/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedProduct)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Updated Laptop"))
                .andExpect(jsonPath("$.cost").value(600.00))
                .andExpect(jsonPath("$.price").value(900.00));

        verify(productService, times(1)).updateProduct(eq(1L), any(Product.class));
    }

    @Test
    void updateProduct_WithNonExistingId_ShouldReturn404() throws Exception {
        // Arrange
        Product updatedProduct = new Product("Updated Laptop", "Electronics", new BigDecimal("600.00"), new BigDecimal("900.00"));
        when(productService.updateProduct(eq(999L), any(Product.class)))
                .thenThrow(new ProductNotFoundException("Product not found with id: 999"));

        // Act & Assert
        mockMvc.perform(put("/api/products/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedProduct)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Product not found with id: 999"));

        verify(productService, times(1)).updateProduct(eq(999L), any(Product.class));
    }

    @Test
    void updateProduct_WithMissingName_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "category": "Electronics",
                    "cost": 600.00,
                    "price": 900.00
                }
                """;

        // Act & Assert
        mockMvc.perform(put("/api/products/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.name").exists());

        verify(productService, never()).updateProduct(any(), any());
    }

    @Test
    void updateProduct_WithInvalidData_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "Updated Laptop",
                    "category": "Electronics",
                    "cost": -100.00,
                    "price": 900.00
                }
                """;

        // Act & Assert
        mockMvc.perform(put("/api/products/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.cost").exists());

        verify(productService, never()).updateProduct(any(), any());
    }

    @Test
    void updateProduct_WithServiceValidationException_ShouldReturn400() throws Exception {
        // Arrange
        Product updatedProduct = new Product("Updated Laptop", "Electronics", new BigDecimal("600.00"), new BigDecimal("900.00"));
        when(productService.updateProduct(eq(1L), any(Product.class)))
                .thenThrow(new ProductValidationException("Custom validation error"));

        // Act & Assert
        mockMvc.perform(put("/api/products/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedProduct)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Custom validation error"));

        verify(productService, times(1)).updateProduct(eq(1L), any(Product.class));
    }

    // DELETE Product Tests

    @Test
    void deleteProduct_WithExistingId_ShouldReturn204() throws Exception {
        // Arrange
        doNothing().when(productService).deleteProduct(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/products/1"))
                .andExpect(status().isNoContent());

        verify(productService, times(1)).deleteProduct(1L);
    }

    @Test
    void deleteProduct_WithNonExistingId_ShouldReturn404() throws Exception {
        // Arrange
        doThrow(new ProductNotFoundException("Product not found with id: 999"))
                .when(productService).deleteProduct(999L);

        // Act & Assert
        mockMvc.perform(delete("/api/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Product not found with id: 999"));

        verify(productService, times(1)).deleteProduct(999L);
    }
}
