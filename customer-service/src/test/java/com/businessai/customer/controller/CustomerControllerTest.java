package com.businessai.customer.controller;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.businessai.customer.entity.Customer;
import com.businessai.customer.exception.CustomerNotFoundException;
import com.businessai.customer.exception.CustomerValidationException;
import com.businessai.customer.service.CustomerService;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Unit tests for CustomerController using MockMvc.
 * Tests all CRUD operations, validation errors, and 404 responses.
 */
@WebMvcTest(CustomerController.class)
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    private Customer validCustomer;

    @BeforeEach
    void setUp() {
        validCustomer = new Customer("John Doe", "john.doe@example.com", "Enterprise", "USA");
        validCustomer.setId(1L);
    }

    // CREATE Customer Tests

    @Test
    void createCustomer_WithValidData_ShouldReturn201AndCustomer() throws Exception {
        // Arrange
        Customer newCustomer = new Customer("Jane Smith", "jane.smith@example.com", "SMB", "Canada");
        newCustomer.setId(2L);
        when(customerService.createCustomer(any(Customer.class))).thenReturn(newCustomer);

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newCustomer)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Jane Smith"))
                .andExpect(jsonPath("$.email").value("jane.smith@example.com"))
                .andExpect(jsonPath("$.segment").value("SMB"))
                .andExpect(jsonPath("$.country").value("Canada"));

        verify(customerService, times(1)).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithMissingName_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "email": "test@example.com",
                    "segment": "Enterprise",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed for customer"))
                .andExpect(jsonPath("$.details.name").exists());

        verify(customerService, never()).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithBlankName_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "   ",
                    "email": "test@example.com",
                    "segment": "Enterprise",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"));

        verify(customerService, never()).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithMissingEmail_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "John Doe",
                    "segment": "Enterprise",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.email").exists());

        verify(customerService, never()).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithInvalidEmail_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "John Doe",
                    "email": "invalid-email",
                    "segment": "Enterprise",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.email").exists());

        verify(customerService, never()).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithMissingSegment_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.segment").exists());

        verify(customerService, never()).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithMissingCountry_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "segment": "Enterprise"
                }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.country").exists());

        verify(customerService, never()).createCustomer(any(Customer.class));
    }

    @Test
    void createCustomer_WithServiceValidationException_ShouldReturn400() throws Exception {
        // Arrange
        Customer newCustomer = new Customer("Jane Smith", "jane.smith@example.com", "SMB", "Canada");
        when(customerService.createCustomer(any(Customer.class)))
                .thenThrow(new CustomerValidationException("Email already exists: jane.smith@example.com"));

        // Act & Assert
        mockMvc.perform(post("/api/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newCustomer)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Email already exists: jane.smith@example.com"));

        verify(customerService, times(1)).createCustomer(any(Customer.class));
    }

    // GET Customer by ID Tests

    @Test
    void getCustomerById_WithExistingId_ShouldReturn200AndCustomer() throws Exception {
        // Arrange
        when(customerService.getCustomerById(1L)).thenReturn(validCustomer);

        // Act & Assert
        mockMvc.perform(get("/api/customers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("John Doe"))
                .andExpect(jsonPath("$.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.segment").value("Enterprise"))
                .andExpect(jsonPath("$.country").value("USA"));

        verify(customerService, times(1)).getCustomerById(1L);
    }

    @Test
    void getCustomerById_WithNonExistingId_ShouldReturn404() throws Exception {
        // Arrange
        when(customerService.getCustomerById(999L))
                .thenThrow(new CustomerNotFoundException("Customer not found with id: 999"));

        // Act & Assert
        mockMvc.perform(get("/api/customers/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Customer not found with id: 999"));

        verify(customerService, times(1)).getCustomerById(999L);
    }

    // GET All Customers Tests

    @Test
    void getAllCustomers_ShouldReturn200AndCustomerList() throws Exception {
        // Arrange
        Customer customer2 = new Customer("Jane Smith", "jane.smith@example.com", "SMB", "Canada");
        customer2.setId(2L);
        List<Customer> customers = Arrays.asList(validCustomer, customer2);
        when(customerService.getAllCustomers()).thenReturn(customers);

        // Act & Assert
        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("John Doe"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("Jane Smith"));

        verify(customerService, times(1)).getAllCustomers();
    }

    @Test
    void getAllCustomers_WithEmptyList_ShouldReturn200AndEmptyArray() throws Exception {
        // Arrange
        when(customerService.getAllCustomers()).thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/api/customers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(customerService, times(1)).getAllCustomers();
    }

    // UPDATE Customer Tests

    @Test
    void updateCustomer_WithValidData_ShouldReturn200AndUpdatedCustomer() throws Exception {
        // Arrange
        Customer updatedCustomer = new Customer("John Doe Updated", "john.updated@example.com", "Enterprise", "Canada");
        updatedCustomer.setId(1L);
        when(customerService.updateCustomer(eq(1L), any(Customer.class))).thenReturn(updatedCustomer);

        // Act & Assert
        mockMvc.perform(put("/api/customers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedCustomer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("John Doe Updated"))
                .andExpect(jsonPath("$.email").value("john.updated@example.com"))
                .andExpect(jsonPath("$.country").value("Canada"));

        verify(customerService, times(1)).updateCustomer(eq(1L), any(Customer.class));
    }

    @Test
    void updateCustomer_WithNonExistingId_ShouldReturn404() throws Exception {
        // Arrange
        Customer updatedCustomer = new Customer("John Doe Updated", "john.updated@example.com", "Enterprise", "Canada");
        when(customerService.updateCustomer(eq(999L), any(Customer.class)))
                .thenThrow(new CustomerNotFoundException("Customer not found with id: 999"));

        // Act & Assert
        mockMvc.perform(put("/api/customers/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedCustomer)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Customer not found with id: 999"));

        verify(customerService, times(1)).updateCustomer(eq(999L), any(Customer.class));
    }

    @Test
    void updateCustomer_WithMissingName_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "email": "john@example.com",
                    "segment": "Enterprise",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(put("/api/customers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.name").exists());

        verify(customerService, never()).updateCustomer(any(), any());
    }

    @Test
    void updateCustomer_WithInvalidEmail_ShouldReturn400() throws Exception {
        // Arrange
        String invalidJson = """
                {
                    "name": "John Doe",
                    "email": "invalid-email",
                    "segment": "Enterprise",
                    "country": "USA"
                }
                """;

        // Act & Assert
        mockMvc.perform(put("/api/customers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.email").exists());

        verify(customerService, never()).updateCustomer(any(), any());
    }

    @Test
    void updateCustomer_WithServiceValidationException_ShouldReturn400() throws Exception {
        // Arrange
        Customer updatedCustomer = new Customer("John Doe Updated", "john.updated@example.com", "Enterprise", "Canada");
        when(customerService.updateCustomer(eq(1L), any(Customer.class)))
                .thenThrow(new CustomerValidationException("Email already exists: john.updated@example.com"));

        // Act & Assert
        mockMvc.perform(put("/api/customers/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedCustomer)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Email already exists: john.updated@example.com"));

        verify(customerService, times(1)).updateCustomer(eq(1L), any(Customer.class));
    }

    // DELETE Customer Tests

    @Test
    void deleteCustomer_WithExistingId_ShouldReturn204() throws Exception {
        // Arrange
        doNothing().when(customerService).deleteCustomer(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/customers/1"))
                .andExpect(status().isNoContent());

        verify(customerService, times(1)).deleteCustomer(1L);
    }

    @Test
    void deleteCustomer_WithNonExistingId_ShouldReturn404() throws Exception {
        // Arrange
        doThrow(new CustomerNotFoundException("Customer not found with id: 999"))
                .when(customerService).deleteCustomer(999L);

        // Act & Assert
        mockMvc.perform(delete("/api/customers/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Customer not found with id: 999"));

        verify(customerService, times(1)).deleteCustomer(999L);
    }
}
