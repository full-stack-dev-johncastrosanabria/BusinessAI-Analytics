package com.businessai.customer.exception;

/**
 * Exception thrown when customer validation fails.
 */
public class CustomerValidationException extends RuntimeException {

    public CustomerValidationException(String message) {
        super(message);
    }

    public CustomerValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
