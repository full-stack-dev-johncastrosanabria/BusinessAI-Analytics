# REST Clients Implementation Summary

## Overview
This document summarizes the implementation of REST clients for the Sales Service to communicate with the Product Service and Customer Service.

## Task Details
**Task:** 6.4 Implement REST clients for Product and Customer services
- Create ProductClient using RestTemplate
- Create CustomerClient using RestTemplate
- Add error handling for service communication failures
- **Requirements:** 21.8 (Microservices SHALL communicate synchronously via REST APIs)

## Implementation

### 1. REST Client Classes

#### ProductClient (`com.businessai.sales.client.ProductClient`)
- **Purpose:** Communicates with Product Service (port 8081) to validate products and retrieve product data
- **Key Methods:**
  - `getProductById(Long productId)`: Retrieves product information
  - `validateProductExists(Long productId)`: Validates that a product exists
- **Error Handling:**
  - `HttpClientErrorException.NotFound`: Product not found (404)
  - `ResourceAccessException`: Service unavailable (connection refused)
  - Generic exceptions: Unexpected errors
  - Null response handling

#### CustomerClient (`com.businessai.sales.client.CustomerClient`)
- **Purpose:** Communicates with Customer Service (port 8082) to validate customers and retrieve customer data
- **Key Methods:**
  - `getCustomerById(Long customerId)`: Retrieves customer information
  - `validateCustomerExists(Long customerId)`: Validates that a customer exists
- **Error Handling:**
  - `HttpClientErrorException.NotFound`: Customer not found (404)
  - `ResourceAccessException`: Service unavailable (connection refused)
  - Generic exceptions: Unexpected errors
  - Null response handling

### 2. Data Transfer Objects (DTOs)

#### ProductDTO (`com.businessai.sales.dto.ProductDTO`)
- Mirrors the Product entity from Product Service
- Fields: id, name, category, cost, price, createdAt, updatedAt

#### CustomerDTO (`com.businessai.sales.dto.CustomerDTO`)
- Mirrors the Customer entity from Customer Service
- Fields: id, name, email, segment, country, createdAt, updatedAt

### 3. Custom Exceptions

#### ProductServiceException (`com.businessai.sales.exception.ProductServiceException`)
- Thrown when Product Service communication fails
- Wraps underlying exceptions with meaningful messages

#### CustomerServiceException (`com.businessai.sales.exception.CustomerServiceException`)
- Thrown when Customer Service communication fails
- Wraps underlying exceptions with meaningful messages

### 4. Configuration

#### RestClientConfig (`com.businessai.sales.config.RestClientConfig`)
- Provides RestTemplate bean with configured timeouts:
  - Connect timeout: 5 seconds
  - Read timeout: 10 seconds

#### Application Configuration (`application.yml`)
- Added service URL configuration:
  ```yaml
  services:
    product:
      url: http://localhost:8081
    customer:
      url: http://localhost:8082
  ```

## Error Handling Strategy

### 1. Service Unavailable (ResourceAccessException)
- **Scenario:** Target service is not running or network issues
- **Response:** User-friendly message "Service is unavailable. Please try again later."
- **Logging:** Error logged with URL and error details

### 2. Resource Not Found (HttpClientErrorException.NotFound)
- **Scenario:** Customer or Product ID does not exist
- **Response:** "Customer/Product not found with ID: {id}"
- **Logging:** Error logged with ID

### 3. Null Response
- **Scenario:** Service returns null (unexpected)
- **Response:** "Customer/Product not found with ID: {id}"
- **Logging:** Error logged indicating null response

### 4. Unexpected Errors
- **Scenario:** Any other exception
- **Response:** "Failed to retrieve customer/product information: {message}"
- **Logging:** Full error details logged

## Testing

### Unit Tests
- **ProductClientTest:** 7 test cases covering all scenarios
- **CustomerClientTest:** 7 test cases covering all scenarios
- **Total:** 14 unit tests, all passing

### Test Coverage
- Success scenarios
- Not found scenarios (404)
- Service unavailable scenarios (connection refused)
- Null response scenarios
- Unexpected exception scenarios
- Validation methods

## Usage Example

```java
@Service
public class SalesService {
    
    private final ProductClient productClient;
    private final CustomerClient customerClient;
    
    public SalesTransaction createTransaction(SalesTransactionRequest request) {
        // Validate customer exists
        customerClient.validateCustomerExists(request.getCustomerId());
        
        // Validate product exists and get price
        ProductDTO product = productClient.getProductById(request.getProductId());
        
        // Calculate total amount
        BigDecimal totalAmount = product.getPrice()
            .multiply(new BigDecimal(request.getQuantity()));
        
        // Create and save transaction
        SalesTransaction transaction = new SalesTransaction();
        transaction.setCustomerId(request.getCustomerId());
        transaction.setProductId(request.getProductId());
        transaction.setQuantity(request.getQuantity());
        transaction.setTotalAmount(totalAmount);
        
        return salesRepository.save(transaction);
    }
}
```

## Benefits

1. **Separation of Concerns:** REST client logic isolated in dedicated classes
2. **Reusability:** Clients can be used by multiple service classes
3. **Testability:** Easy to mock for unit testing
4. **Error Handling:** Comprehensive error handling with meaningful messages
5. **Logging:** Detailed logging for debugging and monitoring
6. **Configuration:** Externalized service URLs for easy environment changes
7. **Timeouts:** Configured timeouts prevent hanging requests

## Next Steps

The REST clients are ready to be integrated into the Sales Service layer (Task 6.5) for:
- Validating customer and product references before creating sales transactions
- Retrieving product prices for total amount calculation
- Providing detailed error messages when validation fails
