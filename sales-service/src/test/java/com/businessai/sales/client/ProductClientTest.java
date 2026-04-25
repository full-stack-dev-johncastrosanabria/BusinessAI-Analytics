package com.businessai.sales.client;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.exception.ProductServiceException;

/**
 * Unit tests for ProductClient.
 */
@ExtendWith(MockitoExtension.class)
class ProductClientTest {

    @Mock
    private RestTemplate restTemplate;

    private ProductClient productClient;

    private static final String PRODUCT_SERVICE_URL = "http://localhost:8081";

    @BeforeEach
    void setUp() {
        productClient = new ProductClient(restTemplate, PRODUCT_SERVICE_URL);
    }

    @Test
    void getProductById_Success() {
        // Arrange
        Long productId = 1L;
        ProductDTO expectedProduct = new ProductDTO(
            productId, 
            "Laptop", 
            "Electronics", 
            new BigDecimal("800.00"), 
            new BigDecimal("1200.00")
        );
        
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenReturn(expectedProduct);

        // Act
        ProductDTO actualProduct = productClient.getProductById(productId);

        // Assert
        assertNotNull(actualProduct);
        assertEquals(expectedProduct.getId(), actualProduct.getId());
        assertEquals(expectedProduct.getName(), actualProduct.getName());
        assertEquals(expectedProduct.getCategory(), actualProduct.getCategory());
        assertEquals(expectedProduct.getPrice(), actualProduct.getPrice());
    }

    @Test
    void getProductById_NotFound_ThrowsException() {
        // Arrange
        Long productId = 999L;
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenThrow(HttpClientErrorException.NotFound.create(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Not Found",
                org.springframework.http.HttpHeaders.EMPTY,
                new byte[0],
                null
            ));

        // Act & Assert
        ProductServiceException exception = assertThrows(
            ProductServiceException.class,
            () -> productClient.getProductById(productId)
        );
        
        assertTrue(exception.getMessage().contains("Product not found with ID: " + productId));
    }

    @Test
    void getProductById_ServiceUnavailable_ThrowsException() {
        // Arrange
        Long productId = 1L;
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenThrow(new ResourceAccessException("Connection refused"));

        // Act & Assert
        ProductServiceException exception = assertThrows(
            ProductServiceException.class,
            () -> productClient.getProductById(productId)
        );
        
        assertTrue(exception.getMessage().contains("Product Service is unavailable"));
    }

    @Test
    void getProductById_ReturnsNull_ThrowsException() {
        // Arrange
        Long productId = 1L;
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenReturn(null);

        // Act & Assert
        ProductServiceException exception = assertThrows(
            ProductServiceException.class,
            () -> productClient.getProductById(productId)
        );
        
        assertTrue(exception.getMessage().contains("Product not found with ID: " + productId));
    }

    @Test
    void getProductById_UnexpectedException_ThrowsException() {
        // Arrange
        Long productId = 1L;
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenThrow(new RuntimeException("Unexpected error"));

        // Act & Assert
        ProductServiceException exception = assertThrows(
            ProductServiceException.class,
            () -> productClient.getProductById(productId)
        );
        
        assertTrue(exception.getMessage().contains("Failed to retrieve product information"));
    }

    @Test
    void validateProductExists_Success() {
        // Arrange
        Long productId = 1L;
        ProductDTO product = new ProductDTO(
            productId, 
            "Laptop", 
            "Electronics", 
            new BigDecimal("800.00"), 
            new BigDecimal("1200.00")
        );
        
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenReturn(product);

        // Act
        boolean exists = productClient.validateProductExists(productId);

        // Assert
        assertTrue(exists);
    }

    @Test
    void validateProductExists_NotFound_ThrowsException() {
        // Arrange
        Long productId = 999L;
        String expectedUrl = PRODUCT_SERVICE_URL + "/api/products/" + productId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(ProductDTO.class)))
            .thenThrow(HttpClientErrorException.NotFound.create(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Not Found",
                org.springframework.http.HttpHeaders.EMPTY,
                new byte[0],
                null
            ));

        // Act & Assert
        assertThrows(
            ProductServiceException.class,
            () -> productClient.validateProductExists(productId)
        );
    }
}
