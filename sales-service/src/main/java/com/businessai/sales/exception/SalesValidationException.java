package com.businessai.sales.exception;

/**
 * Exception thrown when sales transaction validation fails.
 * This includes validation of input parameters, customer existence, and product existence.
 */
public class SalesValidationException extends RuntimeException {

    public SalesValidationException(String message) {
        super(message);
    }

    public SalesValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
