package com.businessai.sales.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for CustomerServiceException.
 * Tests constructor behavior, message propagation, cause chaining, and inheritance.
 * Validates: Requirements 2.3.5
 */
@DisplayName("CustomerServiceException Tests")
class CustomerServiceExceptionTests {

    @Test
    @DisplayName("Should create exception with message")
    void testConstructorWithMessage() {
        // Arrange
        String message = "Customer service unavailable";

        // Act
        CustomerServiceException ex = new CustomerServiceException(message);

        // Assert
        assertEquals(message, ex.getMessage());
    }

    @Test
    @DisplayName("Should create exception with null message")
    void testConstructorWithNullMessage() {
        // Act
        CustomerServiceException ex = new CustomerServiceException((String) null);

        // Assert
        assertNull(ex.getMessage());
    }

    @Test
    @DisplayName("Should create exception with message and cause")
    void testConstructorWithMessageAndCause() {
        // Arrange
        String message = "Failed to communicate with customer service";
        Throwable cause = new RuntimeException("Connection timeout");

        // Act
        CustomerServiceException ex = new CustomerServiceException(message, cause);

        // Assert
        assertEquals(message, ex.getMessage());
        assertSame(cause, ex.getCause());
    }

    @Test
    @DisplayName("Should have null cause when only message constructor is used")
    void testNoCauseWhenOnlyMessageProvided() {
        // Act
        CustomerServiceException ex = new CustomerServiceException("some message");

        // Assert
        assertNull(ex.getCause());
    }

    @Test
    @DisplayName("Should extend RuntimeException")
    void testExtendsRuntimeException() {
        // Act
        CustomerServiceException ex = new CustomerServiceException("test");

        // Assert
        assertInstanceOf(RuntimeException.class, ex);
    }

    @Test
    @DisplayName("Should be throwable and catchable as RuntimeException")
    void testThrowableAsRuntimeException() {
        // Arrange
        String message = "Customer not found in customer service";

        // Act & Assert
        RuntimeException caught = null;
        try {
            throw new CustomerServiceException(message);
        } catch (RuntimeException e) {
            caught = e;
        }

        assertNotNull(caught);
        assertInstanceOf(CustomerServiceException.class, caught);
        assertEquals(message, caught.getMessage());
    }

    @Test
    @DisplayName("Should be throwable and catchable as CustomerServiceException")
    void testThrowableAsCustomerServiceException() {
        // Arrange
        String message = "Customer service error";

        // Act & Assert
        CustomerServiceException caught = null;
        try {
            throw new CustomerServiceException(message);
        } catch (CustomerServiceException e) {
            caught = e;
        }

        assertNotNull(caught);
        assertEquals(message, caught.getMessage());
    }

    @Test
    @DisplayName("Should preserve cause chain with message and cause constructor")
    void testCauseChainPreserved() {
        // Arrange
        Throwable rootCause = new IllegalArgumentException("invalid customer id");
        Throwable wrappedCause = new RuntimeException("service error", rootCause);

        // Act
        CustomerServiceException ex = new CustomerServiceException("customer service failed", wrappedCause);

        // Assert
        assertSame(wrappedCause, ex.getCause());
        assertSame(rootCause, ex.getCause().getCause());
    }
}
