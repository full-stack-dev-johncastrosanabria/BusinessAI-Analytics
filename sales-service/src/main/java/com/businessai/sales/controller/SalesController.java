package com.businessai.sales.controller;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.businessai.sales.entity.SalesTransaction;
import com.businessai.sales.service.SalesService;

/**
 * REST controller for managing sales transactions.
 * Provides endpoints for creating, retrieving, and filtering sales transactions.
 */
@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private static final Logger logger = LoggerFactory.getLogger(SalesController.class);

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    /**
     * Create a new sales transaction.
     * 
     * POST /api/sales
     * 
     * Request body should contain:
     * - customerId: ID of the customer
     * - productId: ID of the product
     * - transactionDate: Date of the transaction (YYYY-MM-DD format)
     * - quantity: Quantity sold
     * 
     * Response: Created transaction with calculated totalAmount
     * 
     * @param request the sales transaction request
     * @return ResponseEntity with created transaction and HTTP 201 Created status
     */
    @PostMapping
    public ResponseEntity<SalesTransaction> createSalesTransaction(
            @RequestBody CreateSalesTransactionRequest request) {
        logger.info("Received request to create sales transaction: {}", request);
        
        SalesTransaction transaction = salesService.createTransaction(
                request.getCustomerId(),
                request.getProductId(),
                request.getTransactionDate(),
                request.getQuantity()
        );
        
        logger.info("Sales transaction created successfully with ID: {}", transaction.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }

    /**
     * Retrieve a sales transaction by ID.
     * 
     * GET /api/sales/{id}
     * 
     * @param id the transaction ID
     * @return ResponseEntity with transaction details and HTTP 200 OK status
     */
    @GetMapping("/{id}")
    public ResponseEntity<SalesTransaction> getSalesTransactionById(@PathVariable Long id) {
        logger.info("Received request to retrieve sales transaction with ID: {}", id);
        
        SalesTransaction transaction = salesService.getTransactionById(id);
        
        logger.info("Sales transaction retrieved successfully: {}", transaction.getId());
        return ResponseEntity.ok(transaction);
    }

    /**
     * List all sales transactions with optional filters.
     * 
     * GET /api/sales
     * 
     * Query parameters (all optional):
     * - dateFrom: Start date for filtering (YYYY-MM-DD format)
     * - dateTo: End date for filtering (YYYY-MM-DD format)
     * - customerId: Filter by customer ID
     * - productId: Filter by product ID
     * 
     * Supports filtering by any combination of parameters.
     * 
     * @param dateFrom optional start date for filtering
     * @param dateTo optional end date for filtering
     * @param customerId optional customer ID for filtering
     * @param productId optional product ID for filtering
     * @return ResponseEntity with list of transactions matching filter criteria and HTTP 200 OK status
     */
    @GetMapping
    public ResponseEntity<List<SalesTransaction>> listSalesTransactions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long productId) {
        logger.info("Received request to list sales transactions with filters: dateFrom={}, dateTo={}, customerId={}, productId={}",
                dateFrom, dateTo, customerId, productId);
        
        List<SalesTransaction> transactions = salesService.getTransactions(dateFrom, dateTo, customerId, productId);
        
        logger.info("Retrieved {} sales transactions", transactions.size());
        return ResponseEntity.ok(transactions);
    }

    /**
     * Request body for creating a sales transaction.
     */
    public static class CreateSalesTransactionRequest {
        private Long customerId;
        private Long productId;
        private LocalDate transactionDate;
        private Integer quantity;

        public CreateSalesTransactionRequest() {
        }

        public CreateSalesTransactionRequest(Long customerId, Long productId, 
                                            LocalDate transactionDate, Integer quantity) {
            this.customerId = customerId;
            this.productId = productId;
            this.transactionDate = transactionDate;
            this.quantity = quantity;
        }

        // Getters and Setters

        public Long getCustomerId() {
            return customerId;
        }

        public void setCustomerId(Long customerId) {
            this.customerId = customerId;
        }

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public LocalDate getTransactionDate() {
            return transactionDate;
        }

        public void setTransactionDate(LocalDate transactionDate) {
            this.transactionDate = transactionDate;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        @Override
        public String toString() {
            return "CreateSalesTransactionRequest{" +
                    "customerId=" + customerId +
                    ", productId=" + productId +
                    ", transactionDate=" + transactionDate +
                    ", quantity=" + quantity +
                    '}';
        }
    }
}
