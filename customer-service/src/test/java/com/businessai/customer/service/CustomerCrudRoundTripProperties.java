package com.businessai.customer.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.businessai.customer.entity.Customer;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;

/**
 * Property-based tests for Customer CRUD round-trip operations.
 * Uses jqwik with Spring Boot Test integration.
 * 
 * **Validates: Requirements 2.3, 2.4**
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CustomerCrudRoundTripProperties {

    @Autowired
    private CustomerService customerService;

    /**
     * Property 4: Customer CRUD Round-Trip Preserves Data
     * 
     * **Validates: Requirements 2.3, 2.4**
     * 
     * For any valid customer, creating the customer, then retrieving it SHALL return
     * data that matches the original customer data.
     */
    @Test
    void createRetrieveRoundTrip_preservesCustomerData() {
        // Use jqwik's Arbitrary API to generate test data programmatically
        Arbitrary<String> names = validCustomerNames();
        Arbitrary<String> emails = validEmails();
        Arbitrary<String> segments = validSegments();
        Arbitrary<String> countries = validCountries();
        
        // Run property test manually with 100 tries
        for (int i = 0; i < 100; i++) {
            String name = names.sample();
            String email = emails.sample();
            String segment = segments.sample();
            String country = countries.sample();
            
            // Arrange - Create a customer with generated valid data
            Customer originalCustomer = new Customer(name, email, segment, country);

            // Act - Create the customer
            Customer createdCustomer = customerService.createCustomer(originalCustomer);
            assertNotNull(createdCustomer.getId(), "Created customer should have an ID");

            // Act - Retrieve the customer
            Customer retrievedCustomer = customerService.getCustomerById(createdCustomer.getId());

            // Assert - Retrieved customer matches original data
            assertNotNull(retrievedCustomer, "Retrieved customer should not be null");
            assertEquals(createdCustomer.getId(), retrievedCustomer.getId(), "IDs should match");
            assertEquals(name, retrievedCustomer.getName(), "Names should match");
            assertEquals(email, retrievedCustomer.getEmail(), "Emails should match");
            assertEquals(segment, retrievedCustomer.getSegment(), "Segments should match");
            assertEquals(country, retrievedCustomer.getCountry(), "Countries should match");
            assertNotNull(retrievedCustomer.getCreatedAt(), "Created timestamp should be set");
            assertNotNull(retrievedCustomer.getUpdatedAt(), "Updated timestamp should be set");
            
            // Cleanup
            customerService.deleteCustomer(createdCustomer.getId());
        }
    }

    /**
     * Property 4: Customer CRUD Round-Trip Preserves Data (Update variant)
     * 
     * **Validates: Requirements 2.3, 2.4**
     * 
     * For any valid customer, creating a customer, updating it with new valid data,
     * then retrieving it SHALL return the updated data.
     */
    @Test
    void createUpdateRetrieveRoundTrip_preservesUpdatedData() {
        // Use jqwik's Arbitrary API to generate test data programmatically
        Arbitrary<String> names = validCustomerNames();
        Arbitrary<String> emails = validEmails();
        Arbitrary<String> segments = validSegments();
        Arbitrary<String> countries = validCountries();
        
        // Run property test manually with 100 tries
        for (int i = 0; i < 100; i++) {
            String originalName = names.sample();
            String originalEmail = emails.sample();
            String originalSegment = segments.sample();
            String originalCountry = countries.sample();
            
            String updatedName = names.sample();
            String updatedEmail = emails.sample();
            String updatedSegment = segments.sample();
            String updatedCountry = countries.sample();
            
            // Arrange - Create a customer with original data
            Customer originalCustomer = new Customer(originalName, originalEmail, originalSegment, originalCountry);

            // Act - Create the customer
            Customer createdCustomer = customerService.createCustomer(originalCustomer);
            assertNotNull(createdCustomer.getId(), "Created customer should have an ID");
            Long customerId = createdCustomer.getId();

            // Arrange - Prepare updated customer data
            Customer updatedCustomer = new Customer(updatedName, updatedEmail, updatedSegment, updatedCountry);

            // Act - Update the customer
            Customer resultAfterUpdate = customerService.updateCustomer(customerId, updatedCustomer);

            // Act - Retrieve the customer
            Customer retrievedCustomer = customerService.getCustomerById(customerId);

            // Assert - Retrieved customer matches updated data
            assertNotNull(retrievedCustomer, "Retrieved customer should not be null");
            assertEquals(customerId, retrievedCustomer.getId(), "ID should remain the same");
            assertEquals(updatedName, retrievedCustomer.getName(), "Name should be updated");
            assertEquals(updatedEmail, retrievedCustomer.getEmail(), "Email should be updated");
            assertEquals(updatedSegment, retrievedCustomer.getSegment(), "Segment should be updated");
            assertEquals(updatedCountry, retrievedCustomer.getCountry(), "Country should be updated");
            
            // Assert - Update result also matches
            assertEquals(updatedName, resultAfterUpdate.getName(), "Update result should have updated name");
            assertEquals(updatedEmail, resultAfterUpdate.getEmail(), "Update result should have updated email");
            assertEquals(updatedSegment, resultAfterUpdate.getSegment(), "Update result should have updated segment");
            assertEquals(updatedCountry, resultAfterUpdate.getCountry(), "Update result should have updated country");
            
            // Cleanup
            customerService.deleteCustomer(customerId);
        }
    }

    // Arbitraries (Generators)

    private Arbitrary<String> validCustomerNames() {
        return Arbitraries.oneOf(
            Arbitraries.strings().alpha().withChars(' ').ofMinLength(1).ofMaxLength(50),
            Arbitraries.of("John Doe", "Jane Smith", "Alice Johnson", "Bob Williams", "Charlie Brown",
                          "Diana Prince", "Eve Adams", "Frank Miller", "Grace Lee", "Henry Ford",
                          "Ivy Chen", "Jack Ryan", "Kate Morgan", "Leo Martinez", "Mary Wilson")
        );
    }

    private Arbitrary<String> validEmails() {
        // Generate unique emails by adding timestamp-based suffix
        Arbitrary<String> localPart = Arbitraries.oneOf(
            Arbitraries.strings().alpha().numeric().ofMinLength(3).ofMaxLength(15),
            Arbitraries.of("john", "jane", "alice", "bob", "charlie", "diana", "eve", "frank", "grace", "henry")
        );
        
        Arbitrary<String> domain = Arbitraries.of(
            "example.com", "test.com", "demo.com", "sample.org", "business.net",
            "company.com", "enterprise.com", "corp.com", "mail.com", "email.com"
        );
        
        return localPart.flatMap(local -> 
            domain.map(dom -> local + System.nanoTime() + "@" + dom)
        );
    }

    private Arbitrary<String> validSegments() {
        return Arbitraries.of(
            "Enterprise",
            "SMB",
            "Startup",
            "Government",
            "Education",
            "Non-Profit",
            "Healthcare",
            "Retail"
        );
    }

    private Arbitrary<String> validCountries() {
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
            "China",
            "Mexico",
            "Spain",
            "Italy",
            "Netherlands",
            "Sweden"
        );
    }
}
