package com.businessai.sales.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.exception.ProductServiceException;

/**
 * REST client for communicating with the Product Service.
 * Handles validation of product existence and retrieval of product data.
 */
@Component
public class ProductClient {

    private static final Logger logger = LoggerFactory.getLogger(ProductClient.class);

    private final RestTemplate restTemplate;
    private final String productServiceUrl;

    public ProductClient(RestTemplate restTemplate,
                        @Value("${services.product.url:http://localhost:8081}") String productServiceUrl) {
        this.restTemplate = restTemplate;
        this.productServiceUrl = productServiceUrl;
    }

    /**
     * Retrieves a product by ID from the Product Service.
     *
     * @param productId the product ID to retrieve
     * @return the product data
     * @throws ProductServiceException if the product is not found or service communication fails
     */
    public ProductDTO getProductById(Long productId) {
        String url = productServiceUrl + "/api/products/" + productId;
        
        try {
            logger.debug("Calling Product Service to retrieve product with ID: {}", productId);
            ProductDTO product = restTemplate.getForObject(url, ProductDTO.class);
            
            if (product == null) {
                logger.error("Product Service returned null for product ID: {}", productId);
                throw new ProductServiceException("Product not found with ID: " + productId);
            }
            
            logger.debug("Successfully retrieved product: {}", product);
            return product;
            
        } catch (HttpClientErrorException.NotFound e) {
            logger.error("Product not found with ID: {}", productId);
            throw new ProductServiceException("Product not found with ID: " + productId, e);
            
        } catch (ResourceAccessException e) {
            logger.error("Failed to connect to Product Service at {}: {}", url, e.getMessage());
            throw new ProductServiceException("Product Service is unavailable. Please try again later.", e);
            
        } catch (Exception e) {
            logger.error("Unexpected error calling Product Service for product ID {}: {}", productId, e.getMessage());
            throw new ProductServiceException("Failed to retrieve product information: " + e.getMessage(), e);
        }
    }

    /**
     * Validates that a product exists in the Product Service.
     *
     * @param productId the product ID to validate
     * @return true if the product exists
     * @throws ProductServiceException if the product does not exist or service communication fails
     */
    public boolean validateProductExists(Long productId) {
        getProductById(productId); // Will throw exception if not found
        return true;
    }
}
