package com.businessai.sales.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.businessai.sales.dto.CustomerDTO;
import com.businessai.sales.exception.CustomerServiceException;

/**
 * Unit tests for CustomerClient.
 */
@ExtendWith(MockitoExtension.class)
class CustomerClientTest {

    @Mock
    private RestTemplate restTemplate;

    private CustomerClient customerClient;

    private static final String CUSTOMER_SERVICE_URL = "http://localhost:8082";

    @BeforeEach
    void setUp() {
        customerClient = new CustomerClient(restTemplate, CUSTOMER_SERVICE_URL);
    }

    @Test
    void getCustomerById_Success() {
        // Arrange
        Long customerId = 1L;
        CustomerDTO expectedCustomer = new CustomerDTO(
            customerId,
            "John Doe",
            "john.doe@example.com",
            "Enterprise",
            "USA"
        );
        
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenReturn(expectedCustomer);

        // Act
        CustomerDTO actualCustomer = customerClient.getCustomerById(customerId);

        // Assert
        assertNotNull(actualCustomer);
        assertEquals(expectedCustomer.getId(), actualCustomer.getId());
        assertEquals(expectedCustomer.getName(), actualCustomer.getName());
        assertEquals(expectedCustomer.getEmail(), actualCustomer.getEmail());
        assertEquals(expectedCustomer.getSegment(), actualCustomer.getSegment());
        assertEquals(expectedCustomer.getCountry(), actualCustomer.getCountry());
    }

    @Test
    void getCustomerById_NotFound_ThrowsException() {
        // Arrange
        Long customerId = 999L;
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenThrow(HttpClientErrorException.NotFound.create(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Not Found",
                org.springframework.http.HttpHeaders.EMPTY,
                new byte[0],
                null
            ));

        // Act & Assert
        CustomerServiceException exception = assertThrows(
            CustomerServiceException.class,
            () -> customerClient.getCustomerById(customerId)
        );
        
        assertTrue(exception.getMessage().contains("Customer not found with ID: " + customerId));
    }

    @Test
    void getCustomerById_ServiceUnavailable_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenThrow(new ResourceAccessException("Connection refused"));

        // Act & Assert
        CustomerServiceException exception = assertThrows(
            CustomerServiceException.class,
            () -> customerClient.getCustomerById(customerId)
        );
        
        assertTrue(exception.getMessage().contains("Customer Service is unavailable"));
    }

    @Test
    void getCustomerById_ReturnsNull_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenReturn(null);

        // Act & Assert
        CustomerServiceException exception = assertThrows(
            CustomerServiceException.class,
            () -> customerClient.getCustomerById(customerId)
        );
        
        assertTrue(exception.getMessage().contains("Customer not found with ID: " + customerId));
    }

    @Test
    void getCustomerById_UnexpectedException_ThrowsException() {
        // Arrange
        Long customerId = 1L;
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenThrow(new RuntimeException("Unexpected error"));

        // Act & Assert
        CustomerServiceException exception = assertThrows(
            CustomerServiceException.class,
            () -> customerClient.getCustomerById(customerId)
        );
        
        assertTrue(exception.getMessage().contains("Failed to retrieve customer information"));
    }

    @Test
    void validateCustomerExists_Success() {
        // Arrange
        Long customerId = 1L;
        CustomerDTO customer = new CustomerDTO(
            customerId,
            "John Doe",
            "john.doe@example.com",
            "Enterprise",
            "USA"
        );
        
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenReturn(customer);

        // Act
        boolean exists = customerClient.validateCustomerExists(customerId);

        // Assert
        assertTrue(exists);
    }

    @Test
    void validateCustomerExists_NotFound_ThrowsException() {
        // Arrange
        Long customerId = 999L;
        String expectedUrl = CUSTOMER_SERVICE_URL + "/api/customers/" + customerId;
        
        when(restTemplate.getForObject(eq(expectedUrl), eq(CustomerDTO.class)))
            .thenThrow(HttpClientErrorException.NotFound.create(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Not Found",
                org.springframework.http.HttpHeaders.EMPTY,
                new byte[0],
                null
            ));

        // Act & Assert
        assertThrows(
            CustomerServiceException.class,
            () -> customerClient.validateCustomerExists(customerId)
        );
    }
}
