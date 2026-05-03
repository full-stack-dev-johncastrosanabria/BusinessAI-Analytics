package com.businessai.product.controller;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.WebRequest;

import com.businessai.product.controller.GlobalExceptionHandler.ErrorResponse;
import com.businessai.product.exception.ProductNotFoundException;
import com.businessai.product.exception.ProductValidationException;

/**
 * Comprehensive unit tests for GlobalExceptionHandler.
 * Tests exception mapping, error response formatting, HTTP status codes, and logging.
 * Validates: Requirements 2.3.4
 */
@DisplayName("GlobalExceptionHandler Tests")
class GlobalExceptionHandlerTests {

    private GlobalExceptionHandler exceptionHandler;
    private WebRequest mockRequest;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        mockRequest = mock(WebRequest.class);
        when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/1");
    }

    @Nested
    @DisplayName("ProductNotFoundException Handling Tests")
    class ProductNotFoundExceptionHandlingTests {

        @Test
        @DisplayName("Should handle ProductNotFoundException with 404 status")
        void testHandleProductNotFoundException() {
            // Arrange
            String errorMessage = "Product with ID 1 not found";
            ProductNotFoundException exception = new ProductNotFoundException(errorMessage);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(404, response.getBody().getStatus());
            assertEquals("Not Found", response.getBody().getError());
            assertEquals(errorMessage, response.getBody().getMessage());
            assertEquals("/api/products/1", response.getBody().getPath());
        }

        @Test
        @DisplayName("Should include timestamp in error response")
        void testProductNotFoundExceptionIncludesTimestamp() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Product not found");
            LocalDateTime beforeCall = LocalDateTime.now();

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);
            LocalDateTime afterCall = LocalDateTime.now();

            // Assert
            assertNotNull(response.getBody().getTimestamp());
            assertTrue(response.getBody().getTimestamp().isAfter(beforeCall.minusSeconds(1)));
            assertTrue(response.getBody().getTimestamp().isBefore(afterCall.plusSeconds(1)));
        }

        @Test
        @DisplayName("Should have null details for ProductNotFoundException")
        void testProductNotFoundExceptionHasNullDetails() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Product not found");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals(null, response.getBody().getDetails());
        }

        @Test
        @DisplayName("Should handle ProductNotFoundException with cause")
        void testHandleProductNotFoundExceptionWithCause() {
            // Arrange
            Throwable cause = new RuntimeException("Database error");
            ProductNotFoundException exception = new ProductNotFoundException("Product not found", cause);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
            assertEquals(404, response.getBody().getStatus());
            assertEquals("Product not found", response.getBody().getMessage());
        }

        @Test
        @DisplayName("Should extract path from WebRequest correctly")
        void testProductNotFoundExceptionExtractsPathCorrectly() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");
            when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/123");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals("/api/products/123", response.getBody().getPath());
        }
    }

    @Nested
    @DisplayName("ProductValidationException Handling Tests")
    class ProductValidationExceptionHandlingTests {

        @Test
        @DisplayName("Should handle ProductValidationException with 400 status")
        void testHandleProductValidationException() {
            // Arrange
            String errorMessage = "Product name cannot be empty";
            ProductValidationException exception = new ProductValidationException(errorMessage);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(400, response.getBody().getStatus());
            assertEquals("Bad Request", response.getBody().getError());
            assertEquals(errorMessage, response.getBody().getMessage());
            assertEquals("/api/products/1", response.getBody().getPath());
        }

        @Test
        @DisplayName("Should include timestamp in validation error response")
        void testProductValidationExceptionIncludesTimestamp() {
            // Arrange
            ProductValidationException exception = new ProductValidationException("Validation failed");
            LocalDateTime beforeCall = LocalDateTime.now();

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);
            LocalDateTime afterCall = LocalDateTime.now();

            // Assert
            assertNotNull(response.getBody().getTimestamp());
            assertTrue(response.getBody().getTimestamp().isAfter(beforeCall.minusSeconds(1)));
            assertTrue(response.getBody().getTimestamp().isBefore(afterCall.plusSeconds(1)));
        }

        @Test
        @DisplayName("Should have null details for ProductValidationException")
        void testProductValidationExceptionHasNullDetails() {
            // Arrange
            ProductValidationException exception = new ProductValidationException("Validation failed");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);

            // Assert
            assertEquals(null, response.getBody().getDetails());
        }

        @Test
        @DisplayName("Should handle ProductValidationException with cause")
        void testHandleProductValidationExceptionWithCause() {
            // Arrange
            Throwable cause = new IllegalArgumentException("Invalid price");
            ProductValidationException exception = new ProductValidationException("Validation failed", cause);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals(400, response.getBody().getStatus());
            assertEquals("Validation failed", response.getBody().getMessage());
        }
    }

    @Nested
    @DisplayName("MethodArgumentNotValidException Handling Tests")
    class MethodArgumentNotValidExceptionHandlingTests {

        @Test
        @DisplayName("Should handle MethodArgumentNotValidException with 400 status")
        void testHandleMethodArgumentNotValidException() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            FieldError fieldError = new FieldError("product", "name", "Name is required");
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of(fieldError));
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(400, response.getBody().getStatus());
            assertEquals("Bad Request", response.getBody().getError());
            assertEquals("Validation failed for product", response.getBody().getMessage());
        }

        @Test
        @DisplayName("Should include field-level validation details")
        void testMethodArgumentNotValidExceptionIncludesFieldDetails() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            FieldError fieldError = new FieldError("product", "price", "Price must be positive");
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of(fieldError));
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            assertNotNull(response.getBody().getDetails());
            assertEquals("Price must be positive", response.getBody().getDetails().get("price"));
        }

        @Test
        @DisplayName("Should handle multiple field validation errors")
        void testMethodArgumentNotValidExceptionWithMultipleErrors() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            FieldError error1 = new FieldError("product", "name", "Name is required");
            FieldError error2 = new FieldError("product", "price", "Price must be positive");
            FieldError error3 = new FieldError("product", "category", "Category is required");
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of(error1, error2, error3));
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            Map<String, String> details = response.getBody().getDetails();
            assertEquals(3, details.size());
            assertEquals("Name is required", details.get("name"));
            assertEquals("Price must be positive", details.get("price"));
            assertEquals("Category is required", details.get("category"));
        }

        @Test
        @DisplayName("Should include timestamp in validation error response")
        void testMethodArgumentNotValidExceptionIncludesTimestamp() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of());
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);
            LocalDateTime beforeCall = LocalDateTime.now();

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);
            LocalDateTime afterCall = LocalDateTime.now();

            // Assert
            assertNotNull(response.getBody().getTimestamp());
            assertTrue(response.getBody().getTimestamp().isAfter(beforeCall.minusSeconds(1)));
            assertTrue(response.getBody().getTimestamp().isBefore(afterCall.plusSeconds(1)));
        }

        @Test
        @DisplayName("Should handle empty validation errors")
        void testMethodArgumentNotValidExceptionWithNoErrors() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of());
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals(400, response.getBody().getStatus());
            assertNotNull(response.getBody().getDetails());
            assertEquals(0, response.getBody().getDetails().size());
        }
    }

    @Nested
    @DisplayName("Generic Exception Handling Tests")
    class GenericExceptionHandlingTests {

        @Test
        @DisplayName("Should handle generic Exception with 500 status")
        void testHandleGenericException() {
            // Arrange
            Exception exception = new RuntimeException("Unexpected error");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(500, response.getBody().getStatus());
            assertEquals("Internal Server Error", response.getBody().getError());
            assertEquals("An unexpected error occurred", response.getBody().getMessage());
            assertEquals("/api/products/1", response.getBody().getPath());
        }

        @Test
        @DisplayName("Should have null details for generic exception")
        void testGenericExceptionHasNullDetails() {
            // Arrange
            Exception exception = new RuntimeException("Unexpected error");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals(null, response.getBody().getDetails());
        }

        @Test
        @DisplayName("Should include timestamp in generic error response")
        void testGenericExceptionIncludesTimestamp() {
            // Arrange
            Exception exception = new RuntimeException("Unexpected error");
            LocalDateTime beforeCall = LocalDateTime.now();

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);
            LocalDateTime afterCall = LocalDateTime.now();

            // Assert
            assertNotNull(response.getBody().getTimestamp());
            assertTrue(response.getBody().getTimestamp().isAfter(beforeCall.minusSeconds(1)));
            assertTrue(response.getBody().getTimestamp().isBefore(afterCall.plusSeconds(1)));
        }

        @Test
        @DisplayName("Should handle NullPointerException")
        void testHandleNullPointerException() {
            // Arrange
            Exception exception = new NullPointerException("Null value encountered");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals(500, response.getBody().getStatus());
            assertEquals("Internal Server Error", response.getBody().getError());
        }

        @Test
        @DisplayName("Should handle IllegalArgumentException")
        void testHandleIllegalArgumentException() {
            // Arrange
            Exception exception = new IllegalArgumentException("Invalid argument");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals(500, response.getBody().getStatus());
        }

        @Test
        @DisplayName("Should handle exception with nested cause")
        void testHandleExceptionWithNestedCause() {
            // Arrange
            Throwable cause = new RuntimeException("Root cause");
            Exception exception = new RuntimeException("Wrapper exception", cause);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals(500, response.getBody().getStatus());
        }
    }

    @Nested
    @DisplayName("Error Response Formatting Tests")
    class ErrorResponseFormattingTests {

        @Test
        @DisplayName("Should format error response with all required fields")
        void testErrorResponseHasAllRequiredFields() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Product not found");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);
            ErrorResponse errorResponse = response.getBody();

            // Assert
            assertNotNull(errorResponse.getTimestamp());
            assertNotNull(errorResponse.getStatus());
            assertNotNull(errorResponse.getError());
            assertNotNull(errorResponse.getMessage());
            assertNotNull(errorResponse.getPath());
        }

        @Test
        @DisplayName("Should format error response with correct message")
        void testErrorResponseMessageFormatting() {
            // Arrange
            String customMessage = "Custom error message";
            ProductValidationException exception = new ProductValidationException(customMessage);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);

            // Assert
            assertEquals(customMessage, response.getBody().getMessage());
        }

        @Test
        @DisplayName("Should format error response with correct path")
        void testErrorResponsePathFormatting() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");
            when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/999");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals("/api/products/999", response.getBody().getPath());
        }

        @Test
        @DisplayName("Should handle path with query parameters")
        void testErrorResponsePathWithQueryParameters() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");
            when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/1?filter=active");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals("/api/products/1?filter=active", response.getBody().getPath());
        }

        @Test
        @DisplayName("Should handle path with special characters")
        void testErrorResponsePathWithSpecialCharacters() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");
            when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/test%20product");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals("/api/products/test%20product", response.getBody().getPath());
        }
    }

    @Nested
    @DisplayName("HTTP Status Code Handling Tests")
    class HttpStatusCodeHandlingTests {

        @Test
        @DisplayName("Should return 404 for ProductNotFoundException")
        void testStatusCode404ForProductNotFoundException() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
            assertEquals(404, response.getStatusCodeValue());
        }

        @Test
        @DisplayName("Should return 400 for ProductValidationException")
        void testStatusCode400ForProductValidationException() {
            // Arrange
            ProductValidationException exception = new ProductValidationException("Validation failed");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals(400, response.getStatusCodeValue());
        }

        @Test
        @DisplayName("Should return 400 for MethodArgumentNotValidException")
        void testStatusCode400ForMethodArgumentNotValidException() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of());
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals(400, response.getStatusCodeValue());
        }

        @Test
        @DisplayName("Should return 500 for generic Exception")
        void testStatusCode500ForGenericException() {
            // Arrange
            Exception exception = new RuntimeException("Unexpected error");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals(500, response.getStatusCodeValue());
        }

        @Test
        @DisplayName("Should return correct status code in error response body")
        void testStatusCodeInErrorResponseBody() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals(404, response.getBody().getStatus());
            assertEquals(response.getStatusCodeValue(), response.getBody().getStatus());
        }
    }

    @Nested
    @DisplayName("Error Response Structure Tests")
    class ErrorResponseStructureTests {

        @Test
        @DisplayName("Should create ErrorResponse with all parameters")
        void testErrorResponseCreation() {
            // Arrange
            LocalDateTime timestamp = LocalDateTime.now();
            int status = 404;
            String error = "Not Found";
            String message = "Product not found";
            String path = "/api/products/1";

            // Act
            ErrorResponse errorResponse = new ErrorResponse(timestamp, status, error, message, null, path);

            // Assert
            assertEquals(timestamp, errorResponse.getTimestamp());
            assertEquals(status, errorResponse.getStatus());
            assertEquals(error, errorResponse.getError());
            assertEquals(message, errorResponse.getMessage());
            assertEquals(path, errorResponse.getPath());
        }

        @Test
        @DisplayName("Should handle ErrorResponse with details map")
        void testErrorResponseWithDetails() {
            // Arrange
            LocalDateTime timestamp = LocalDateTime.now();
            Map<String, String> details = java.util.Map.of("field1", "error1", "field2", "error2");

            // Act
            ErrorResponse errorResponse = new ErrorResponse(timestamp, 400, "Bad Request", "Validation failed", details, "/api/products");

            // Assert
            assertEquals(details, errorResponse.getDetails());
            assertEquals(2, errorResponse.getDetails().size());
        }

        @Test
        @DisplayName("Should handle ErrorResponse with null details")
        void testErrorResponseWithNullDetails() {
            // Arrange
            LocalDateTime timestamp = LocalDateTime.now();

            // Act
            ErrorResponse errorResponse = new ErrorResponse(timestamp, 404, "Not Found", "Not found", null, "/api/products/1");

            // Assert
            assertEquals(null, errorResponse.getDetails());
        }

        @Test
        @DisplayName("Should have correct error message for 404")
        void testErrorMessageFor404() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Product not found");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals("Not Found", response.getBody().getError());
        }

        @Test
        @DisplayName("Should have correct error message for 400")
        void testErrorMessageFor400() {
            // Arrange
            ProductValidationException exception = new ProductValidationException("Validation failed");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductValidationException(exception, mockRequest);

            // Assert
            assertEquals("Bad Request", response.getBody().getError());
        }

        @Test
        @DisplayName("Should have correct error message for 500")
        void testErrorMessageFor500() {
            // Arrange
            Exception exception = new RuntimeException("Unexpected error");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertEquals("Internal Server Error", response.getBody().getError());
        }
    }

    @Nested
    @DisplayName("Exception Logging Tests")
    class ExceptionLoggingTests {

        @Test
        @DisplayName("Should handle generic exception without throwing")
        void testGenericExceptionHandlingDoesNotThrow() {
            // Arrange
            Exception exception = new RuntimeException("Test error");

            // Act & Assert - should not throw
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);
            assertNotNull(response);
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        }

        @Test
        @DisplayName("Should handle exception with long message")
        void testExceptionWithLongMessage() {
            // Arrange
            String longMessage = "A".repeat(1000);
            Exception exception = new RuntimeException(longMessage);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertNotNull(response.getBody());
            assertEquals(500, response.getBody().getStatus());
        }

        @Test
        @DisplayName("Should handle exception with special characters in message")
        void testExceptionWithSpecialCharactersInMessage() {
            // Arrange
            String messageWithSpecialChars = "Error: <script>alert('xss')</script>";
            Exception exception = new RuntimeException(messageWithSpecialChars);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertNotNull(response.getBody());
            assertEquals(500, response.getBody().getStatus());
        }

        @Test
        @DisplayName("Should handle exception with null message")
        void testExceptionWithNullMessage() {
            // Arrange
            Exception exception = new RuntimeException((String) null);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleGlobalException(exception, mockRequest);

            // Assert
            assertNotNull(response.getBody());
            assertEquals(500, response.getBody().getStatus());
            assertEquals("An unexpected error occurred", response.getBody().getMessage());
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Tests")
    class EdgeCasesAndBoundaryTests {

        @Test
        @DisplayName("Should handle exception with empty message")
        void testExceptionWithEmptyMessage() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("");

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleProductNotFoundException(exception, mockRequest);

            // Assert
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
            assertEquals("", response.getBody().getMessage());
        }

        @Test
        @DisplayName("Should handle multiple consecutive exceptions")
        void testMultipleConsecutiveExceptions() {
            // Arrange
            ProductNotFoundException exception1 = new ProductNotFoundException("Not found 1");
            ProductNotFoundException exception2 = new ProductNotFoundException("Not found 2");

            // Act
            ResponseEntity<ErrorResponse> response1 = exceptionHandler.handleProductNotFoundException(exception1, mockRequest);
            ResponseEntity<ErrorResponse> response2 = exceptionHandler.handleProductNotFoundException(exception2, mockRequest);

            // Assert
            assertEquals(404, response1.getBody().getStatus());
            assertEquals(404, response2.getBody().getStatus());
            assertEquals("Not found 1", response1.getBody().getMessage());
            assertEquals("Not found 2", response2.getBody().getMessage());
        }

        @Test
        @DisplayName("Should handle exception with different request paths")
        void testExceptionWithDifferentRequestPaths() {
            // Arrange
            ProductNotFoundException exception = new ProductNotFoundException("Not found");

            // Act & Assert - first path
            when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/1");
            ResponseEntity<ErrorResponse> response1 = exceptionHandler.handleProductNotFoundException(exception, mockRequest);
            assertEquals("/api/products/1", response1.getBody().getPath());

            // Act & Assert - second path
            when(mockRequest.getDescription(false)).thenReturn("uri=/api/products/2");
            ResponseEntity<ErrorResponse> response2 = exceptionHandler.handleProductNotFoundException(exception, mockRequest);
            assertEquals("/api/products/2", response2.getBody().getPath());
        }

        @Test
        @DisplayName("Should handle validation exception with single field error")
        void testValidationExceptionWithSingleFieldError() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            FieldError fieldError = new FieldError("product", "name", "Name is required");
            when(bindingResult.getAllErrors()).thenReturn(java.util.List.of(fieldError));
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            assertEquals(1, response.getBody().getDetails().size());
            assertTrue(response.getBody().getDetails().containsKey("name"));
        }

        @Test
        @DisplayName("Should handle validation exception with many field errors")
        void testValidationExceptionWithManyFieldErrors() {
            // Arrange
            BindingResult bindingResult = mock(BindingResult.class);
            java.util.List<org.springframework.validation.ObjectError> errors = new java.util.ArrayList<>();
            for (int i = 0; i < 10; i++) {
                errors.add(new FieldError("product", "field" + i, "Error " + i));
            }
            when(bindingResult.getAllErrors()).thenReturn(errors);
            MethodArgumentNotValidException exception = new MethodArgumentNotValidException(null, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationException(exception, mockRequest);

            // Assert
            assertEquals(10, response.getBody().getDetails().size());
        }
    }
}
