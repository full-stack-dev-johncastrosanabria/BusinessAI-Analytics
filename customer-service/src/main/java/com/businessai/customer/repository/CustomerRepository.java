package com.businessai.customer.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.businessai.customer.entity.Customer;

/**
 * Repository interface for Customer entity.
 * Provides CRUD operations and custom query methods for Customer data access.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    /**
     * Find a customer by email address.
     *
     * @param email the customer email
     * @return Optional containing the customer if found, empty otherwise
     */
    Optional<Customer> findByEmail(String email);

    /**
     * Find all customers by segment.
     *
     * @param segment the customer segment
     * @return list of customers in the specified segment
     */
    List<Customer> findBySegment(String segment);

    /**
     * Find all customers by country.
     *
     * @param country the customer country
     * @return list of customers in the specified country
     */
    List<Customer> findByCountry(String country);

    /**
     * Check if a customer exists with the given email.
     *
     * @param email the customer email
     * @return true if a customer with the email exists, false otherwise
     */
    boolean existsByEmail(String email);
}
