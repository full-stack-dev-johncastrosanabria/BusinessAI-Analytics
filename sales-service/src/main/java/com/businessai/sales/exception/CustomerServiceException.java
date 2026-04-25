package com.businessai.sales.exception;

/**
 * Exception thrown when communication with the Customer Service fails
 * or when a customer is not found.
 */
public class CustomerServiceException extends RuntimeException {

    public CustomerServiceException(String message) {
        super(message);
    }

    public CustomerServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
