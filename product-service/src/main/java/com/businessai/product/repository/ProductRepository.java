package com.businessai.product.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.businessai.product.entity.Product;

/**
 * Repository interface for Product entity.
 * Provides CRUD operations and custom query methods for Product data access.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Find all products by category.
     *
     * @param category the product category
     * @return list of products in the specified category
     */
    List<Product> findByCategory(String category);

    /**
     * Find all products by name containing the specified string (case-insensitive).
     *
     * @param name the name substring to search for
     * @return list of products matching the name pattern
     */
    List<Product> findByNameContainingIgnoreCase(String name);

    /**
     * Check if a product exists with the given name.
     *
     * @param name the product name
     * @return true if a product with the name exists, false otherwise
     */
    boolean existsByName(String name);
}
