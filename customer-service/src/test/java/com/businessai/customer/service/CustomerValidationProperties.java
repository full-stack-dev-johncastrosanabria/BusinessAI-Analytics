package com.businessai.customer.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.businessai.customer.entity.Customer;
import com.businessai.customer.exception.CustomerValidationException;
import com.businessai.customer.repository.CustomerRepository;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.lifecycle.BeforeTry;

/**
 * Property-based tests for Customer validation.
 * 
 * **Validates: Requirements 2.2**
 */
class CustomerValidationProperties {

    private CustomerRepository customerRepository;
    private CustomerService customerService;

    @BeforeTry
    void setUp() {
        // Initialize mocks before each property test try
        customerRepository = mock(CustomerRepository.class);
        customerService = new CustomerService(customerRepository);
    }

    /**
     * Property 3: Customer Email Validation
     * 
     * **Validates: Requirements 2.2**
     * 
     * For any customer creation request, the Customer Service SHALL accept customers
     * with valid email formats (containing @ and domain) and reject customers with
     * invalid email formats.
     */
    @Property(tries = 1000)
    @Label("Customer validation accepts valid email formats")
    void customerValidation_acceptsValidEmails(@ForAll("validEmails") String validEmail,
                                               @ForAll("validNames") String name,
                                               @ForAll("validSegments") String segment,
                                               @ForAll("validCountries") String country) {
        // Arrange
        Customer customer = new Customer(name, validEmail, segment, country);
        Customer savedCustomer = new Customer(name, validEmail, segment, country);
        savedCustomer.setId(1L);
        
        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);

        // Act
        Customer result = customerService.createCustomer(customer);

        // Assert
        assertNotNull(result);
        assertEquals(validEmail, result.getEmail());
        assertEquals(name, result.getName());
        assertEquals(segment, result.getSegment());
        assertEquals(country, result.getCountry());
        verify(customerRepository, times(1)).save(customer);
    }

    @Property(tries = 1000)
    @Label("Customer validation rejects emails without @ symbol")
    void customerValidation_rejectsEmailsWithoutAtSymbol(@ForAll("emailsWithoutAt") String invalidEmail,
                                                         @ForAll("validNames") String name,
                                                         @ForAll("validSegments") String segment,
                                                         @ForAll("validCountries") String country) {
        // Arrange
        Customer customer = new Customer(name, invalidEmail, segment, country);

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Property(tries = 1000)
    @Label("Customer validation rejects emails with @ at beginning")
    void customerValidation_rejectsEmailsWithAtAtBeginning(@ForAll("emailsWithAtAtBeginning") String invalidEmail,
                                                           @ForAll("validNames") String name,
                                                           @ForAll("validSegments") String segment,
                                                           @ForAll("validCountries") String country) {
        // Arrange
        Customer customer = new Customer(name, invalidEmail, segment, country);

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    @Property(tries = 1000)
    @Label("Customer validation rejects emails without domain after @")
    void customerValidation_rejectsEmailsWithoutDomain(@ForAll("emailsWithoutDomain") String invalidEmail,
                                                       @ForAll("validNames") String name,
                                                       @ForAll("validSegments") String segment,
                                                       @ForAll("validCountries") String country) {
        // Arrange
        Customer customer = new Customer(name, invalidEmail, segment, country);

        // Act & Assert
        CustomerValidationException exception = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer)
        );
        
        assertEquals("Email must contain @ and domain", exception.getMessage());
        verify(customerRepository, never()).save(any());
    }

    // Arbitraries (Generators)

    @Provide
    Arbitrary<String> validEmails() {
        // Generate valid email formats: localpart@domain
        Arbitrary<String> localPart = Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars('.', '_', '-')
            .ofMinLength(1)
            .ofMaxLength(20)
            .filter(s -> !s.isEmpty() && !s.startsWith(".") && !s.endsWith("."));
        
        Arbitrary<String> domain = Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars('.', '-')
            .ofMinLength(1)
            .ofMaxLength(20)
            .filter(s -> !s.isEmpty() && !s.startsWith(".") && !s.endsWith("."));
        
        return Combinators.combine(localPart, domain)
            .as((local, dom) -> local + "@" + dom);
    }

    @Provide
    Arbitrary<String> emailsWithoutAt() {
        // Generate emails without @ symbol
        return Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars('.', '_', '-')
            .ofMinLength(1)
            .ofMaxLength(50)
            .filter(s -> !s.contains("@"));
    }

    @Provide
    Arbitrary<String> emailsWithAtAtBeginning() {
        // Generate emails with @ at the beginning
        Arbitrary<String> domain = Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars('.', '-')
            .ofMinLength(1)
            .ofMaxLength(20);
        
        return domain.map(d -> "@" + d);
    }

    @Provide
    Arbitrary<String> emailsWithoutDomain() {
        // Generate emails without domain after @
        Arbitrary<String> localPart = Arbitraries.strings()
            .alpha()
            .numeric()
            .withChars('.', '_', '-')
            .ofMinLength(1)
            .ofMaxLength(20);
        
        return localPart.map(local -> local + "@");
    }

    @Provide
    Arbitrary<String> validNames() {
        return Arbitraries.oneOf(
            Arbitraries.strings().alpha().ofMinLength(1).ofMaxLength(50),
            Arbitraries.of("John Doe", "Jane Smith", "Alice Johnson", "Bob Williams", "Charlie Brown")
        );
    }

    @Provide
    Arbitrary<String> validSegments() {
        return Arbitraries.of(
            "Enterprise",
            "SMB",
            "Startup",
            "Government",
            "Education",
            "Non-Profit"
        );
    }

    @Provide
    Arbitrary<String> validCountries() {
        return Arbitraries.of(
            "USA",
            "Canada",
            "UK",
            "Germany",
            "France",
            "Japan",
            "Australia",
            "Brazil",
            "India",
            "China"
        );
    }
}
