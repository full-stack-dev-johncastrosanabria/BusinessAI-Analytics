package com.businessai.customer.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.businessai.customer.entity.Customer;
import com.businessai.customer.exception.CustomerNotFoundException;
import com.businessai.customer.exception.CustomerValidationException;
import com.businessai.customer.repository.CustomerRepository;

/**
 * Unit tests for CustomerService.
 */
@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer validCustomer;

    @BeforeEach
    void setUp() {
        validCustomer = new Customer("John Doe", "john.doe@example.com", "Enterprise", "USA");
        validCustomer.setId(1L);
    }

    // Create Customer Tests

    @Test
    void createCustomer_WithValidData_ShouldReturnCreatedCustomer() {
        // Arrange
        Customer newCustomer = new Customer("Jane Smith", "jane.smith@example.com", "SMB", "Canada");
        when(customerRepository.save(any(Customer.class))).thenReturn(newCustomer);

        // Act
        Customer result = customerService.createCustomer(newCustomer);

        // Assert
        assertNotNull(result);
        assertEquals("Jane Smith", result.getName());
        assertEquals("jane.smith@example.com", result.getEmail());
        verify(customerRepository, times(1)).save(newCustomer);
    }

    @Test
    void createCustomer_WithNullCustomer_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(CustomerValidationException.class, () -> customerService.createCustomer(null));
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithNullName_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer(null, "test@example.com", "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer name is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithEmptyName_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("   ", "test@example.com", "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer name is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithNullEmail_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", null, "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer email is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithEmptyEmail_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "  ", "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer email is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithInvalidEmailFormat_NoAtSymbol_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "invalidemail.com", "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithInvalidEmailFormat_AtAtBeginning_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "@example.com", "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithInvalidEmailFormat_NoDomain_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "test@", "Enterprise", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithValidEmailFormat_ShouldSucceed() {
        // Arrange
        Customer customer = new Customer("John Doe", "test@domain.com", "Enterprise", "USA");
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);

        // Act
        Customer result = customerService.createCustomer(customer);

        // Assert
        assertNotNull(result);
        assertEquals("test@domain.com", result.getEmail());
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void createCustomer_WithNullSegment_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "test@example.com", null, "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer segment is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithEmptySegment_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "test@example.com", "  ", "USA");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer segment is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithNullCountry_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "test@example.com", "Enterprise", null);

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer country is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithEmptyCountry_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "test@example.com", "Enterprise", "  ");

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertEquals("Customer country is required", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createCustomer_WithDuplicateEmail_ShouldThrowValidationException() {
        // Arrange
        Customer customer = new Customer("John Doe", "duplicate@example.com", "Enterprise", "USA");
        when(customerRepository.save(any(Customer.class)))
            .thenThrow(new DataIntegrityViolationException("Duplicate entry 'duplicate@example.com' for key 'email'"));

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertTrue(exception.getMessage().contains("Email already exists"));
        verify(customerRepository, times(1)).save(customer);
    }

    @Test
    void createCustomer_WithNonEmailDataIntegrityViolation_ShouldThrowValidationException() {
        // Arrange - DataIntegrityViolationException with a message NOT containing "email"
        Customer customer = new Customer("John Doe", "john@example.com", "Enterprise", "USA");
        DataIntegrityViolationException cause = new DataIntegrityViolationException("Unique constraint violation on 'name'");
        when(customerRepository.save(any(Customer.class))).thenThrow(cause);

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        assertTrue(exception.getMessage().startsWith("Failed to create customer:"));
        assertEquals(cause, exception.getCause());
        verify(customerRepository, times(1)).save(customer);
    }

    // Get Customer Tests

    @Test
    void getCustomerById_WithExistingId_ShouldReturnCustomer() {
        // Arrange
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));

        // Act
        Customer result = customerService.getCustomerById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John Doe", result.getName());
        assertEquals("john.doe@example.com", result.getEmail());
        verify(customerRepository, times(1)).findById(1L);
    }

    @Test
    void getCustomerById_WithNonExistingId_ShouldThrowNotFoundException() {
        // Arrange
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        CustomerNotFoundException exception = assertThrows(
            CustomerNotFoundException.class,
            () -> customerService.getCustomerById(999L)
        );
        assertEquals("Customer not found with id: 999", exception.getMessage());
        verify(customerRepository, times(1)).findById(999L);
    }

    @Test
    void getAllCustomers_ShouldReturnAllCustomers() {
        // Arrange
        Customer customer2 = new Customer("Jane Smith", "jane@example.com", "SMB", "Canada");
        customer2.setId(2L);
        List<Customer> customers = Arrays.asList(validCustomer, customer2);
        when(customerRepository.findAll()).thenReturn(customers);

        // Act
        List<Customer> result = customerService.getAllCustomers();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(customerRepository, times(1)).findAll();
    }

    @Test
    void getCustomersBySegment_WithValidSegment_ShouldReturnCustomers() {
        // Arrange
        List<Customer> customers = Arrays.asList(validCustomer);
        when(customerRepository.findBySegment("Enterprise")).thenReturn(customers);

        // Act
        List<Customer> result = customerService.getCustomersBySegment("Enterprise");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Enterprise", result.get(0).getSegment());
        verify(customerRepository, times(1)).findBySegment("Enterprise");
    }

    @Test
    void getCustomersBySegment_WithNullSegment_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(CustomerValidationException.class, () -> customerService.getCustomersBySegment(null));
        verify(customerRepository, never()).findBySegment(any());
    }

    @Test
    void getCustomersBySegment_WithEmptySegment_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(CustomerValidationException.class, () -> customerService.getCustomersBySegment("  "));
        verify(customerRepository, never()).findBySegment(any());
    }

    @Test
    void getCustomersByCountry_WithValidCountry_ShouldReturnCustomers() {
        // Arrange
        List<Customer> customers = Arrays.asList(validCustomer);
        when(customerRepository.findByCountry("USA")).thenReturn(customers);

        // Act
        List<Customer> result = customerService.getCustomersByCountry("USA");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("USA", result.get(0).getCountry());
        verify(customerRepository, times(1)).findByCountry("USA");
    }

    @Test
    void getCustomersByCountry_WithNullCountry_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(CustomerValidationException.class, () -> customerService.getCustomersByCountry(null));
        verify(customerRepository, never()).findByCountry(any());
    }

    @Test
    void getCustomersByCountry_WithEmptyCountry_ShouldThrowValidationException() {
        // Act & Assert
        assertThrows(CustomerValidationException.class, () -> customerService.getCustomersByCountry("  "));
        verify(customerRepository, never()).findByCountry(any());
    }

    // Update Customer Tests

    @Test
    void updateCustomer_WithValidData_ShouldReturnUpdatedCustomer() {
        // Arrange
        Customer updatedData = new Customer("John Updated", "john.updated@example.com", "SMB", "Canada");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));
        when(customerRepository.existsByEmail("john.updated@example.com")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenReturn(validCustomer);

        // Act
        Customer result = customerService.updateCustomer(1L, updatedData);

        // Assert
        assertNotNull(result);
        assertEquals("John Updated", result.getName());
        assertEquals("john.updated@example.com", result.getEmail());
        assertEquals("SMB", result.getSegment());
        assertEquals("Canada", result.getCountry());
        verify(customerRepository, times(1)).findById(1L);
        verify(customerRepository, times(1)).save(validCustomer);
    }

    @Test
    void updateCustomer_WithSameEmail_ShouldSucceed() {
        // Arrange
        Customer updatedData = new Customer("John Updated", "john.doe@example.com", "SMB", "Canada");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));
        when(customerRepository.save(any(Customer.class))).thenReturn(validCustomer);

        // Act
        Customer result = customerService.updateCustomer(1L, updatedData);

        // Assert
        assertNotNull(result);
        assertEquals("John Updated", result.getName());
        verify(customerRepository, times(1)).findById(1L);
        verify(customerRepository, never()).existsByEmail(any());
        verify(customerRepository, times(1)).save(validCustomer);
    }

    @Test
    void updateCustomer_WithExistingEmail_ShouldThrowValidationException() {
        // Arrange
        Customer updatedData = new Customer("John Updated", "existing@example.com", "SMB", "Canada");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));
        when(customerRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.updateCustomer(1L, updatedData)
        );
        assertTrue(exception.getMessage().contains("Email already exists"));
        verify(customerRepository, times(1)).findById(1L);
        verify(customerRepository, times(1)).existsByEmail("existing@example.com");
        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_WithNonExistingId_ShouldThrowNotFoundException() {
        // Arrange
        Customer updatedData = new Customer("John Updated", "john.updated@example.com", "SMB", "Canada");
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CustomerNotFoundException.class, () -> customerService.updateCustomer(999L, updatedData));
        verify(customerRepository, times(1)).findById(999L);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_WithInvalidData_ShouldThrowValidationException() {
        // Arrange
        Customer invalidData = new Customer(null, "test@example.com", "Enterprise", "USA");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));

        // Act & Assert
        assertThrows(CustomerValidationException.class, () -> customerService.updateCustomer(1L, invalidData));
        verify(customerRepository, times(1)).findById(1L);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_WithInvalidEmailFormat_ShouldThrowValidationException() {
        // Arrange
        Customer invalidData = new Customer("John Doe", "invalidemail", "Enterprise", "USA");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.updateCustomer(1L, invalidData)
        );
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, times(1)).findById(1L);
        verify(customerRepository, never()).save(any());
    }

    // Delete Customer Tests

    @Test
    void deleteCustomer_WithExistingId_ShouldDeleteCustomer() {
        // Arrange
        when(customerRepository.existsById(1L)).thenReturn(true);
        doNothing().when(customerRepository).deleteById(1L);

        // Act
        customerService.deleteCustomer(1L);

        // Assert
        verify(customerRepository, times(1)).existsById(1L);
        verify(customerRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteCustomer_WithNonExistingId_ShouldThrowNotFoundException() {
        // Arrange
        when(customerRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        CustomerNotFoundException exception = assertThrows(
            CustomerNotFoundException.class,
            () -> customerService.deleteCustomer(999L)
        );
        assertEquals("Customer not found with id: 999", exception.getMessage());
        verify(customerRepository, times(1)).existsById(999L);
        verify(customerRepository, never()).deleteById(any());
    }

    // Exists Tests

    @Test
    void existsById_WithExistingId_ShouldReturnTrue() {
        // Arrange
        when(customerRepository.existsById(1L)).thenReturn(true);

        // Act
        boolean result = customerService.existsById(1L);

        // Assert
        assertTrue(result);
        verify(customerRepository, times(1)).existsById(1L);
    }

    @Test
    void existsById_WithNonExistingId_ShouldReturnFalse() {
        // Arrange
        when(customerRepository.existsById(999L)).thenReturn(false);

        // Act
        boolean result = customerService.existsById(999L);

        // Assert
        assertFalse(result);
        verify(customerRepository, times(1)).existsById(999L);
    }

    @Test
    void existsByEmail_WithExistingEmail_ShouldReturnTrue() {
        // Arrange
        when(customerRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        // Act
        boolean result = customerService.existsByEmail("john.doe@example.com");

        // Assert
        assertTrue(result);
        verify(customerRepository, times(1)).existsByEmail("john.doe@example.com");
    }

    @Test
    void existsByEmail_WithNonExistingEmail_ShouldReturnFalse() {
        // Arrange
        when(customerRepository.existsByEmail("nonexistent@example.com")).thenReturn(false);

        // Act
        boolean result = customerService.existsByEmail("nonexistent@example.com");

        // Assert
        assertFalse(result);
        verify(customerRepository, times(1)).existsByEmail("nonexistent@example.com");
    }
}
