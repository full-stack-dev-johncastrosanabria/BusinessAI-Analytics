package com.businessai.customer.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for customer-service exception classes.
 * Tests CustomerNotFoundException and CustomerValidationException constructors,
 * message propagation, cause chaining, and inheritance contracts.
 * Validates: Requirements 2.3.3
 */
@DisplayName("Customer Exception Tests")
class CustomerExceptionTests {

    // -------------------------------------------------------------------------
    // CustomerNotFoundException
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("CustomerNotFoundException Tests")
    class CustomerNotFoundExceptionTests {

        @Test
        @DisplayName("Should create exception with message")
        void testConstructorWithMessage() {
            // Arrange
            String message = "Customer with id 42 not found";

            // Act
            CustomerNotFoundException ex = new CustomerNotFoundException(message);

            // Assert
            assertEquals(message, ex.getMessage());
        }

        @Test
        @DisplayName("Should create exception with null message")
        void testConstructorWithNullMessage() {
            // Act
            CustomerNotFoundException ex = new CustomerNotFoundException((String) null);

            // Assert
            assertNull(ex.getMessage());
        }

        @Test
        @DisplayName("Should create exception with message and cause")
        void testConstructorWithMessageAndCause() {
            // Arrange
            String message = "Customer not found";
            Throwable cause = new RuntimeException("root cause");

            // Act
            CustomerNotFoundException ex = new CustomerNotFoundException(message, cause);

            // Assert
            assertEquals(message, ex.getMessage());
            assertSame(cause, ex.getCause());
        }

        @Test
        @DisplayName("Should have null cause when only message constructor is used")
        void testNoCauseWhenOnlyMessageProvided() {
            // Act
            CustomerNotFoundException ex = new CustomerNotFoundException("some message");

            // Assert
            assertNull(ex.getCause());
        }

        @Test
        @DisplayName("Should extend RuntimeException")
        void testExtendsRuntimeException() {
            // Act
            CustomerNotFoundException ex = new CustomerNotFoundException("test");

            // Assert
            assertInstanceOf(RuntimeException.class, ex);
        }

        @Test
        @DisplayName("Should be throwable and catchable as RuntimeException")
        void testThrowableAsRuntimeException() {
            // Arrange
            String message = "Customer 99 not found";

            // Act & Assert
            RuntimeException caught = null;
            try {
                throw new CustomerNotFoundException(message);
            } catch (RuntimeException e) {
                caught = e;
            }

            assertNotNull(caught);
            assertInstanceOf(CustomerNotFoundException.class, caught);
            assertEquals(message, caught.getMessage());
        }

        @Test
        @DisplayName("Should be throwable and catchable as CustomerNotFoundException")
        void testThrowableAsCustomerNotFoundException() {
            // Arrange
            String message = "Customer not found";

            // Act & Assert
            CustomerNotFoundException caught = null;
            try {
                throw new CustomerNotFoundException(message);
            } catch (CustomerNotFoundException e) {
                caught = e;
            }

            assertNotNull(caught);
            assertEquals(message, caught.getMessage());
        }

        @Test
        @DisplayName("Should preserve cause chain with message and cause constructor")
        void testCauseChainPreserved() {
            // Arrange
            Throwable rootCause = new IllegalArgumentException("invalid id");
            Throwable wrappedCause = new RuntimeException("db error", rootCause);

            // Act
            CustomerNotFoundException ex = new CustomerNotFoundException("not found", wrappedCause);

            // Assert
            assertSame(wrappedCause, ex.getCause());
            assertSame(rootCause, ex.getCause().getCause());
        }
    }

    // -------------------------------------------------------------------------
    // CustomerValidationException
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("CustomerValidationException Tests")
    class CustomerValidationExceptionTests {

        @Test
        @DisplayName("Should create exception with message")
        void testConstructorWithMessage() {
            // Arrange
            String message = "Email address is invalid";

            // Act
            CustomerValidationException ex = new CustomerValidationException(message);

            // Assert
            assertEquals(message, ex.getMessage());
        }

        @Test
        @DisplayName("Should create exception with null message")
        void testConstructorWithNullMessage() {
            // Act
            CustomerValidationException ex = new CustomerValidationException((String) null);

            // Assert
            assertNull(ex.getMessage());
        }

        @Test
        @DisplayName("Should create exception with message and cause")
        void testConstructorWithMessageAndCause() {
            // Arrange
            String message = "Validation failed";
            Throwable cause = new IllegalArgumentException("bad input");

            // Act
            CustomerValidationException ex = new CustomerValidationException(message, cause);

            // Assert
            assertEquals(message, ex.getMessage());
            assertSame(cause, ex.getCause());
        }

        @Test
        @DisplayName("Should have null cause when only message constructor is used")
        void testNoCauseWhenOnlyMessageProvided() {
            // Act
            CustomerValidationException ex = new CustomerValidationException("validation error");

            // Assert
            assertNull(ex.getCause());
        }

        @Test
        @DisplayName("Should extend RuntimeException")
        void testExtendsRuntimeException() {
            // Act
            CustomerValidationException ex = new CustomerValidationException("test");

            // Assert
            assertInstanceOf(RuntimeException.class, ex);
        }

        @Test
        @DisplayName("Should be throwable and catchable as RuntimeException")
        void testThrowableAsRuntimeException() {
            // Arrange
            String message = "Customer name cannot be blank";

            // Act & Assert
            RuntimeException caught = null;
            try {
                throw new CustomerValidationException(message);
            } catch (RuntimeException e) {
                caught = e;
            }

            assertNotNull(caught);
            assertInstanceOf(CustomerValidationException.class, caught);
            assertEquals(message, caught.getMessage());
        }

        @Test
        @DisplayName("Should be throwable and catchable as CustomerValidationException")
        void testThrowableAsCustomerValidationException() {
            // Arrange
            String message = "Validation failed";

            // Act & Assert
            CustomerValidationException caught = null;
            try {
                throw new CustomerValidationException(message);
            } catch (CustomerValidationException e) {
                caught = e;
            }

            assertNotNull(caught);
            assertEquals(message, caught.getMessage());
        }

        @Test
        @DisplayName("Should preserve cause chain with message and cause constructor")
        void testCauseChainPreserved() {
            // Arrange
            Throwable rootCause = new NullPointerException("null field");
            Throwable wrappedCause = new RuntimeException("constraint violation", rootCause);

            // Act
            CustomerValidationException ex = new CustomerValidationException("validation error", wrappedCause);

            // Assert
            assertSame(wrappedCause, ex.getCause());
            assertSame(rootCause, ex.getCause().getCause());
        }
    }

    // -------------------------------------------------------------------------
    // Cross-exception behavior
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("Exception Inheritance and Behavior Tests")
    class ExceptionInheritanceTests {

        @Test
        @DisplayName("CustomerNotFoundException and CustomerValidationException are independent types")
        void testExceptionsAreIndependentTypes() {
            // Arrange
            CustomerNotFoundException notFound = new CustomerNotFoundException("not found");
            CustomerValidationException validation = new CustomerValidationException("invalid");

            // Assert — neither is an instance of the other
            assertInstanceOf(CustomerNotFoundException.class, notFound);
            assertInstanceOf(CustomerValidationException.class, validation);

            // They should NOT be interchangeable
            assertEquals(false, (Object) notFound instanceof CustomerValidationException);
            assertEquals(false, (Object) validation instanceof CustomerNotFoundException);
        }

        @Test
        @DisplayName("Both exceptions are RuntimeExceptions (unchecked)")
        void testBothAreUnchecked() {
            // Act
            CustomerNotFoundException notFound = new CustomerNotFoundException("not found");
            CustomerValidationException validation = new CustomerValidationException("invalid");

            // Assert
            assertInstanceOf(RuntimeException.class, notFound);
            assertInstanceOf(RuntimeException.class, validation);
        }

        @Test
        @DisplayName("Both exceptions carry their messages correctly")
        void testBothCarryMessages() {
            // Arrange
            String notFoundMsg = "Customer 1 not found";
            String validationMsg = "Email is required";

            // Act
            CustomerNotFoundException notFound = new CustomerNotFoundException(notFoundMsg);
            CustomerValidationException validation = new CustomerValidationException(validationMsg);

            // Assert
            assertEquals(notFoundMsg, notFound.getMessage());
            assertEquals(validationMsg, validation.getMessage());
        }

        @Test
        @DisplayName("Both exceptions support cause chaining")
        void testBothSupportCauseChaining() {
            // Arrange
            Throwable cause = new RuntimeException("underlying cause");

            // Act
            CustomerNotFoundException notFound = new CustomerNotFoundException("not found", cause);
            CustomerValidationException validation = new CustomerValidationException("invalid", cause);

            // Assert
            assertSame(cause, notFound.getCause());
            assertSame(cause, validation.getCause());
        }
    }
}
