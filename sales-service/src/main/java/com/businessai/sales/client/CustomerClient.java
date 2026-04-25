package com.businessai.sales.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.exception.CustomerServiceException;

/**
 * REST client for communicating with the Customer Service.
 * Handles validation of customer existence and retrieval of customer data.
 */
@Component
public class CustomerClient {

    private static final Logger logger = LoggerFactory.getLogger(CustomerClient.class);

    private final RestTemplate restTemplate;
    private final String customerServiceUrl;

    public CustomerClient(RestTemplate restTemplate,
                         @Value("${services.customer.url:http://localhost:8082}") String customerServiceUrl) {
        this.restTemplate = restTemplate;
        this.customerServiceUrl = customerServiceUrl;
    }

    /**
     * Retrieves a customer by ID from the Customer Service.
     *
     * @param customerId the customer ID to retrieve
     * @return the customer data
     * @throws CustomerServiceException if the customer is not found or service communication fails
     */
    public CustomerDTO getCustomerById(Long customerId) {
        String url = customerServiceUrl + "/api/customers/" + customerId;
        
        try {
            logger.debug("Calling Customer Service to retrieve customer with ID: {}", customerId);
            CustomerDTO customer = restTemplate.getForObject(url, CustomerDTO.class);
            
            if (customer == null) {
                logger.error("Customer Service returned null for customer ID: {}", customerId);
                throw new CustomerServiceException("Customer not found with ID: " + customerId);
            }
            
            logger.debug("Successfully retrieved customer: {}", customer);
            return customer;
            
        } catch (HttpClientErrorException.NotFound e) {
            logger.error("Customer not found with ID: {}", customerId);
            throw new CustomerServiceException("Customer not found with ID: " + customerId, e);
            
        } catch (ResourceAccessException e) {
            logger.error("Failed to connect to Customer Service at {}: {}", url, e.getMessage());
            throw new CustomerServiceException("Customer Service is unavailable. Please try again later.", e);
            
        } catch (Exception e) {
            logger.error("Unexpected error calling Customer Service for customer ID {}: {}", customerId, e.getMessage());
            throw new CustomerServiceException("Failed to retrieve customer information: " + e.getMessage(), e);
        }
    }

    /**
     * Validates that a customer exists in the Customer Service.
     *
     * @param customerId the customer ID to validate
     * @return true if the customer exists
     * @throws CustomerServiceException if the customer does not exist or service communication fails
     */
    public boolean validateCustomerExists(Long customerId) {
        getCustomerById(customerId); // Will throw exception if not found
        return true;
    }
}
