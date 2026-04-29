package com.businessai.sales.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.businessai.sales.client.CustomerClient;
import com.businessai.sales.client.ProductClient;
import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.dto.ProductDTO;
import com.businessai.sales.exception.CustomerServiceException;
import com.businessai.sales.exception.ProductServiceException;
import com.businessai.sales.entity.SalesTransaction;
import com.businessai.sales.exception.SalesValidationException;
import com.businessai.sales.repository.SalesRepository;

/**
 * Service layer for managing sales transactions.
 * Handles business logic including validation, calculation, and filtering.
 */
@Service
public class SalesService {

    private static final Logger logger = LoggerFactory.getLogger(SalesService.class);

    private final SalesRepository salesRepository;
    private final CustomerClient customerClient;
    private final ProductClient productClient;

    public SalesService(SalesRepository salesRepository,
                       CustomerClient customerClient,
                       ProductClient productClient) {
        this.salesRepository = salesRepository;
        this.customerClient = customerClient;
        this.productClient = productClient;
    }

    /**
     * Creates a new sales transaction with validation and calculation.
     * Validates that the customer and product exist, then calculates the total amount.
     *
     * @param customerId      the customer ID
     * @param productId       the product ID
     * @param transactionDate the transaction date
     * @param quantity        the quantity sold
     * @return the created sales transaction
     * @throws SalesValidationException if validation fails
     */
    @Transactional
    public SalesTransaction createTransaction(Long customerId, Long productId, 
                                             LocalDate transactionDate, Integer quantity) {
        logger.info("Creating sales transaction: customerId={}, productId={}, date={}, quantity={}",
                customerId, productId, transactionDate, quantity);

        // Validate input parameters
        validateTransactionInput(customerId, productId, transactionDate, quantity);

        // Validate customer exists
        CustomerDTO customer = validateCustomer(customerId);
        logger.debug("Customer validation successful: {}", customer.getName());

        // Validate product exists and get price
        ProductDTO product = validateProduct(productId);
        logger.debug("Product validation successful: {} with price {}", product.getName(), product.getPrice());

        // Calculate total amount
        BigDecimal totalAmount = calculateTotalAmount(quantity, product.getPrice());
        logger.debug("Calculated total amount: {}", totalAmount);

        // Create and save transaction
        SalesTransaction transaction = new SalesTransaction(
                customerId,
                productId,
                transactionDate,
                quantity,
                totalAmount
        );

        SalesTransaction savedTransaction = salesRepository.save(transaction);
        logger.info("Sales transaction created successfully with ID: {}", savedTransaction.getId());

        return savedTransaction;
    }

    /**
     * Retrieves a sales transaction by ID.
     *
     * @param id the transaction ID
     * @return the sales transaction
     * @throws SalesValidationException if transaction not found
     */
    public SalesTransaction getTransactionById(Long id) {
        if (id == null) {
            throw new SalesValidationException("Transaction ID cannot be null");
        }
        logger.debug("Retrieving sales transaction with ID: {}", id);
        return salesRepository.findById(id)
                .orElseThrow(() -> new SalesValidationException("Sales transaction not found with ID: " + id));
    }

    /**
     * Retrieves all sales transactions with optional filtering.
     *
     * @param startDate  optional start date for filtering
     * @param endDate    optional end date for filtering
     * @param customerId optional customer ID for filtering
     * @param productId  optional product ID for filtering
     * @return list of sales transactions matching the filters
     */
    public List<SalesTransaction> getTransactions(LocalDate startDate, LocalDate endDate,
                                                  Long customerId, Long productId) {
        logger.debug("Retrieving transactions with filters: startDate={}, endDate={}, customerId={}, productId={}",
                startDate, endDate, customerId, productId);

        // Apply filters based on provided parameters
        if (startDate != null && endDate != null && customerId != null && productId != null) {
            return salesRepository.findByCustomerIdAndProductIdAndDateBetween(customerId, productId, startDate, endDate);
        } else if (startDate != null && endDate != null && customerId != null) {
            return salesRepository.findByCustomerIdAndDateBetween(customerId, startDate, endDate);
        } else if (startDate != null && endDate != null && productId != null) {
            return salesRepository.findByProductIdAndDateBetween(productId, startDate, endDate);
        } else if (startDate != null && endDate != null) {
            return salesRepository.findByTransactionDateBetween(startDate, endDate);
        } else if (customerId != null && productId != null) {
            return salesRepository.findByCustomerIdAndProductId(customerId, productId);
        } else if (customerId != null) {
            return salesRepository.findByCustomerId(customerId);
        } else if (productId != null) {
            return salesRepository.findByProductId(productId);
        } else {
            return salesRepository.findAllOrderByDateDesc();
        }
    }

    /**
     * Validates transaction input parameters.
     *
     * @param customerId      the customer ID
     * @param productId       the product ID
     * @param transactionDate the transaction date
     * @param quantity        the quantity
     * @throws SalesValidationException if any parameter is invalid
     */
    private void validateTransactionInput(Long customerId, Long productId, 
                                         LocalDate transactionDate, Integer quantity) {
        if (customerId == null) {
            throw new SalesValidationException("Customer ID is required");
        }
        if (productId == null) {
            throw new SalesValidationException("Product ID is required");
        }
        if (transactionDate == null) {
            throw new SalesValidationException("Transaction date is required");
        }
        if (quantity == null || quantity < 1) {
            throw new SalesValidationException("Quantity must be at least 1");
        }
    }

    /**
     * Validates that a customer exists by calling the Customer Service.
     *
     * @param customerId the customer ID to validate
     * @return the customer data
     * @throws SalesValidationException if customer does not exist or service call fails
     */
    private CustomerDTO validateCustomer(Long customerId) {
        try {
            return customerClient.getCustomerById(customerId);
        } catch (CustomerServiceException e) {
            logger.error("Customer validation failed for ID {}: {}", customerId, e.getMessage());
            throw new SalesValidationException("Customer validation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Validates that a product exists by calling the Product Service.
     *
     * @param productId the product ID to validate
     * @return the product data
     * @throws SalesValidationException if product does not exist or service call fails
     */
    private ProductDTO validateProduct(Long productId) {
        try {
            return productClient.getProductById(productId);
        } catch (ProductServiceException e) {
            logger.error("Product validation failed for ID {}: {}", productId, e.getMessage());
            throw new SalesValidationException("Product validation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Calculates the total amount as quantity × product price.
     *
     * @param quantity the quantity sold
     * @param price    the product price
     * @return the calculated total amount
     */
    private BigDecimal calculateTotalAmount(Integer quantity, BigDecimal price) {
        if (price == null) {
            throw new SalesValidationException("Product price is required for calculation");
        }
        return price.multiply(new BigDecimal(quantity));
    }
}
