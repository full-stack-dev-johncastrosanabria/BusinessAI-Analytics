package com.businessai.customer.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.businessai.customer.entity.Customer;
import com.businessai.customer.exception.CustomerNotFoundException;
import com.businessai.customer.exception.CustomerValidationException;
import com.businessai.customer.repository.CustomerRepository;

/**
 * Service layer for Customer business logic.
 * Handles CRUD operations with validation and exception handling.
 */
@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    /**
     * Create a new customer with validation.
     *
     * @param customer the customer to create
     * @return the created customer with generated ID
     * @throws CustomerValidationException if validation fails
     */
    public Customer createCustomer(Customer customer) {
        validateCustomer(customer);
        
        try {
            return customerRepository.save(customer);
        } catch (DataIntegrityViolationException e) {
            // Handle unique email constraint violation
            if (e.getMessage().contains("email")) {
                throw new CustomerValidationException("Email already exists: " + customer.getEmail());
            }
            throw new CustomerValidationException("Failed to create customer: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieve a customer by ID.
     *
     * @param id the customer ID
     * @return the customer
     * @throws CustomerNotFoundException if customer not found
     */
    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + id));
    }

    /**
     * Retrieve all customers.
     *
     * @return list of all customers
     */
    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    /**
     * Retrieve customers by segment.
     *
     * @param segment the customer segment
     * @return list of customers in the segment
     */
    @Transactional(readOnly = true)
    public List<Customer> getCustomersBySegment(String segment) {
        if (segment == null || segment.trim().isEmpty()) {
            throw new CustomerValidationException("Segment cannot be null or empty");
        }
        return customerRepository.findBySegment(segment);
    }

    /**
     * Retrieve customers by country.
     *
     * @param country the customer country
     * @return list of customers in the country
     */
    @Transactional(readOnly = true)
    public List<Customer> getCustomersByCountry(String country) {
        if (country == null || country.trim().isEmpty()) {
            throw new CustomerValidationException("Country cannot be null or empty");
        }
        return customerRepository.findByCountry(country);
    }

    /**
     * Update an existing customer with validation.
     *
     * @param id the customer ID
     * @param updatedCustomer the updated customer data
     * @return the updated customer
     * @throws CustomerNotFoundException if customer not found
     * @throws CustomerValidationException if validation fails
     */
    public Customer updateCustomer(Long id, Customer updatedCustomer) {
        Customer existingCustomer = getCustomerById(id);
        
        validateCustomer(updatedCustomer);
        
        // Check if email is being changed to an existing email
        if (!existingCustomer.getEmail().equals(updatedCustomer.getEmail()) 
                && customerRepository.existsByEmail(updatedCustomer.getEmail())) {
            throw new CustomerValidationException("Email already exists: " + updatedCustomer.getEmail());
        }
        
        existingCustomer.setName(updatedCustomer.getName());
        existingCustomer.setEmail(updatedCustomer.getEmail());
        existingCustomer.setSegment(updatedCustomer.getSegment());
        existingCustomer.setCountry(updatedCustomer.getCountry());
        
        return customerRepository.save(existingCustomer);
    }

    /**
     * Delete a customer by ID.
     *
     * @param id the customer ID
     * @throws CustomerNotFoundException if customer not found
     */
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new CustomerNotFoundException("Customer not found with id: " + id);
        }
        customerRepository.deleteById(id);
    }

    /**
     * Check if a customer exists by ID.
     *
     * @param id the customer ID
     * @return true if customer exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return customerRepository.existsById(id);
    }

    /**
     * Check if a customer exists by email.
     *
     * @param email the customer email
     * @return true if customer exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return customerRepository.existsByEmail(email);
    }

    /**
     * Validate customer data.
     * Validates required fields and business rules including email format.
     *
     * @param customer the customer to validate
     * @throws CustomerValidationException if validation fails
     */
    private void validateCustomer(Customer customer) {
        if (customer == null) {
            throw new CustomerValidationException("Customer cannot be null");
        }

        // Validate name
        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            throw new CustomerValidationException("Customer name is required");
        }

        // Validate email
        if (customer.getEmail() == null || customer.getEmail().trim().isEmpty()) {
            throw new CustomerValidationException("Customer email is required");
        }
        
        // Validate email format (must contain @ and domain)
        if (!isValidEmailFormat(customer.getEmail())) {
            throw new CustomerValidationException("Email must contain @ and domain");
        }

        // Validate segment
        if (customer.getSegment() == null || customer.getSegment().trim().isEmpty()) {
            throw new CustomerValidationException("Customer segment is required");
        }

        // Validate country
        if (customer.getCountry() == null || customer.getCountry().trim().isEmpty()) {
            throw new CustomerValidationException("Customer country is required");
        }
    }

    /**
     * Validate email format.
     * Email must contain @ symbol and a domain after it.
     *
     * @param email the email to validate
     * @return true if email format is valid, false otherwise
     */
    private boolean isValidEmailFormat(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        String trimmedEmail = email.trim();
        
        // Check if email contains @
        int atIndex = trimmedEmail.indexOf('@');
        if (atIndex <= 0) {
            return false; // @ not found or at the beginning
        }
        
        // Check if there's a domain after @
        String domain = trimmedEmail.substring(atIndex + 1);
        // Domain must be non-empty
        return !domain.isEmpty();
    }
