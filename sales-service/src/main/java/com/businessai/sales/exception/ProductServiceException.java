package com.businessai.sales.exception;

/**
 * Exception thrown when communication with the Product Service fails
 * or when a product is not found.
 */
public class ProductServiceException extends RuntimeException {

    public ProductServiceException(String message) {
        super(message);
    }

    public ProductServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
