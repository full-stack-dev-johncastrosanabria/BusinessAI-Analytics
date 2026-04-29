package com.businessai.customer.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.Mockito.mock;

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
 * Property 12: Backward Compatibility Preservation
 *
 * For any fix applied by the Issue_Resolver, all existing APIs, interfaces, and public
 * methods SHALL maintain backward compatibility as verified by existing integration tests.
 *
 * **Validates: Requirements 2.8**
 */
class BackwardCompatibilityProperties {

    private CustomerRepository customerRepository;
    private CustomerService customerService;

    @BeforeTry
    void setUp() {
        customerRepository = mock(CustomerRepository.class);
        customerService = new CustomerService(customerRepository);
    }

    /**
     * Property: emails containing @ with a non-empty local part and non-empty domain are valid.
     *
     * **Validates: Requirements 2.8**
     */
    @Property(tries = 1000)
    @Label("Emails with @ and domain are accepted by validateCustomer")
    void emailsWithAtAndDomainAreValid(@ForAll("validEmails") String email) {
        Customer customer = new Customer("Test User", email, "Enterprise", "USA");

        // Should not throw — valid email passes validation
        try {
            customerService.createCustomer(customer);
        } catch (CustomerValidationException e) {
            fail("Valid email '" + email + "' should not cause CustomerValidationException: " + e.getMessage());
        } catch (Exception e) {
            // Other exceptions (e.g. from null repository) are acceptable — validation passed
        }
    }

    /**
     * Property: emails without @ are always invalid.
     *
     * **Validates: Requirements 2.8**
     */
    @Property(tries = 1000)
    @Label("Emails without @ are always rejected")
    void emailsWithoutAtAreAlwaysInvalid(@ForAll("emailsWithoutAt") String email) {
        Customer customer = new Customer("Test User", email, "Enterprise", "USA");

        CustomerValidationException ex = assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer),
            "Email without @ should be rejected: " + email
        );

        assertEquals("Email must contain @ and domain", ex.getMessage());
    }

    /**
     * Property: null or empty emails are always invalid.
     *
     * **Validates: Requirements 2.8**
     */
    @Property(tries = 100)
    @Label("Null or empty emails are always rejected")
    void nullOrEmptyEmailsAreAlwaysInvalid(@ForAll("nullOrEmptyEmails") String email) {
        Customer customer = new Customer("Test User", email, "Enterprise", "USA");

        assertThrows(
            CustomerValidationException.class,
            () -> customerService.createCustomer(customer),
            "Null or empty email should be rejected: '" + email + "'"
        );
    }

    // --- Arbitraries ---

    @Provide
    Arbitrary<String> validEmails() {
        Arbitrary<String> localPart = Arbitraries.strings()
            .alpha()
            .ofMinLength(1)
            .ofMaxLength(20);

        Arbitrary<String> domain = Arbitraries.strings()
            .alpha()
            .ofMinLength(1)
            .ofMaxLength(20);

        return Combinators.combine(localPart, domain)
            .as((local, dom) -> local + "@" + dom);
    }

    @Provide
    Arbitrary<String> emailsWithoutAt() {
        return Arbitraries.strings()
            .alpha()
            .numeric()
            .ofMinLength(1)
            .ofMaxLength(50)
            .filter(s -> !s.contains("@"));
    }

    @Provide
    Arbitrary<String> nullOrEmptyEmails() {
        return Arbitraries.of("", "   ", null);
    }
}
