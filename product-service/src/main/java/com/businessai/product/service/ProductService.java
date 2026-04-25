package com.businessai.product.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.businessai.product.entity.Product;
import com.businessai.product.exception.ProductNotFoundException;
import com.businessai.product.exception.ProductValidationException;
import com.businessai.product.repository.ProductRepository;

/**
 * Service layer for Product business logic.
 * Handles CRUD operations with validation and exception handling.
 */
@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Create a new product with validation.
     *
     * @param product the product to create
     * @return the created product with generated ID
     * @throws ProductValidationException if validation fails
     */
    public Product createProduct(Product product) {
        validateProduct(product);
        return productRepository.save(product);
    }

    /**
     * Retrieve a product by ID.
     *
     * @param id the product ID
     * @return the product
     * @throws ProductNotFoundException if product not found
     */
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
    }

    /**
     * Retrieve all products.
     *
     * @return list of all products
     */
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    /**
     * Retrieve products by category.
     *
     * @param category the product category
     * @return list of products in the category
     */
    @Transactional(readOnly = true)
    public List<Product> getProductsByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            throw new ProductValidationException("Category cannot be null or empty");
        }
        return productRepository.findByCategory(category);
    }

    /**
     * Search products by name (case-insensitive).
     *
     * @param name the name substring to search for
     * @return list of matching products
     */
    @Transactional(readOnly = true)
    public List<Product> searchProductsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new ProductValidationException("Search name cannot be null or empty");
        }
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    /**
     * Update an existing product with validation.
     *
     * @param id the product ID
     * @param updatedProduct the updated product data
     * @return the updated product
     * @throws ProductNotFoundException if product not found
     * @throws ProductValidationException if validation fails
     */
    public Product updateProduct(Long id, Product updatedProduct) {
        Product existingProduct = getProductById(id);
        
        validateProduct(updatedProduct);
        
        existingProduct.setName(updatedProduct.getName());
        existingProduct.setCategory(updatedProduct.getCategory());
        existingProduct.setCost(updatedProduct.getCost());
        existingProduct.setPrice(updatedProduct.getPrice());
        
        return productRepository.save(existingProduct);
    }

    /**
     * Delete a product by ID.
     *
     * @param id the product ID
     * @throws ProductNotFoundException if product not found
     */
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    /**
     * Check if a product exists by ID.
     *
     * @param id the product ID
     * @return true if product exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    /**
     * Check if a product exists by name.
     *
     * @param name the product name
     * @return true if product exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return productRepository.existsByName(name);
    }

    /**
     * Validate product data.
     * Validates required fields and business rules.
     *
     * @param product the product to validate
     * @throws ProductValidationException if validation fails
     */
    private void validateProduct(Product product) {
        if (product == null) {
            throw new ProductValidationException("Product cannot be null");
        }

        // Validate name
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new ProductValidationException("Product name is required");
        }

        // Validate category
        if (product.getCategory() == null || product.getCategory().trim().isEmpty()) {
            throw new ProductValidationException("Product category is required");
        }

        // Validate cost
        if (product.getCost() == null) {
            throw new ProductValidationException("Product cost is required");
        }
        if (product.getCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new ProductValidationException("Product cost must be greater than or equal to 0");
        }

        // Validate price
        if (product.getPrice() == null) {
            throw new ProductValidationException("Product price is required");
        }
        if (product.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ProductValidationException("Product price must be greater than or equal to 0");
        }
    }
}
