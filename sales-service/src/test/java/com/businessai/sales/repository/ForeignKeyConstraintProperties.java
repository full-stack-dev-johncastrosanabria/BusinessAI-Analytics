package com.businessai.sales.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.dao.DataIntegrityViolationException;

import com.businessai.sales.SalesServiceApplication;
import com.businessai.sales.entity.SalesTransaction;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Label;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.Positive;
import net.jqwik.api.lifecycle.BeforeContainer;

/**
 * Property-based tests for foreign key constraint enforcement in sales transactions.
 * 
 * **Validates: Requirements 16.2, 16.3**
 */
class ForeignKeyConstraintProperties {

    private static ConfigurableApplicationContext context;
    private static SalesRepository salesRepository;

    @BeforeContainer
    static void initSpring() {
        if (context == null) {
            context = SpringApplication.run(SalesServiceApplication.class, 
                "--spring.profiles.active=test");
            salesRepository = context.getBean(SalesRepository.class);
        }
    }

    /**
     * Property 20: Foreign Key Constraint Enforcement
     * 
     * **Validates: Requirements 16.2, 16.3**
     * 
     * For any sales transaction creation attempt with a customer ID or product ID
     * that does not exist in the respective tables, the database SHALL reject the
     * insertion and enforce referential integrity.
     */
    @Property(tries = 100)
    @Label("Foreign key constraint rejects transactions with non-existent customer IDs")
    void foreignKeyConstraint_rejectsNonExistentCustomerId(
            @ForAll("nonExistentIds") Long nonExistentCustomerId,
            @ForAll @Positive Long existingProductId,
            @ForAll("validDates") LocalDate transactionDate,
            @ForAll @Positive int quantity,
            @ForAll("validAmounts") BigDecimal totalAmount) {
        
        // Arrange
        SalesTransaction transaction = new SalesTransaction(
            nonExistentCustomerId,
            existingProductId,
            transactionDate,
            quantity,
            totalAmount
        );

        // Act & Assert
        // The database should reject this transaction due to foreign key constraint violation
        Exception exception = assertThrows(
            DataIntegrityViolationException.class,
            () -> {
                salesRepository.save(transaction);
                salesRepository.flush(); // Force immediate database interaction
            }
        );
        
        // Verify the exception is related to foreign key constraint
        String message = exception.getMessage().toLowerCase();
        assertTrue(
            message.contains("foreign key") || 
            message.contains("constraint") || 
            message.contains("cannot add or update"),
            "Exception should indicate foreign key constraint violation"
        );
    }

    @Property(tries = 100)
    @Label("Foreign key constraint rejects transactions with non-existent product IDs")
    void foreignKeyConstraint_rejectsNonExistentProductId(
            @ForAll @Positive Long existingCustomerId,
            @ForAll("nonExistentIds") Long nonExistentProductId,
            @ForAll("validDates") LocalDate transactionDate,
            @ForAll @Positive int quantity,
            @ForAll("validAmounts") BigDecimal totalAmount) {
        
        // Arrange
        SalesTransaction transaction = new SalesTransaction(
            existingCustomerId,
            nonExistentProductId,
            transactionDate,
            quantity,
            totalAmount
        );

        // Act & Assert
        // The database should reject this transaction due to foreign key constraint violation
        Exception exception = assertThrows(
            DataIntegrityViolationException.class,
            () -> {
                salesRepository.save(transaction);
                salesRepository.flush(); // Force immediate database interaction
            }
        );
        
        // Verify the exception is related to foreign key constraint
        String message = exception.getMessage().toLowerCase();
        assertTrue(
            message.contains("foreign key") || 
            message.contains("constraint") || 
            message.contains("cannot add or update"),
            "Exception should indicate foreign key constraint violation"
        );
    }

    @Property(tries = 100)
    @Label("Foreign key constraint rejects transactions with both non-existent customer and product IDs")
    void foreignKeyConstraint_rejectsBothNonExistentIds(
            @ForAll("nonExistentIds") Long nonExistentCustomerId,
            @ForAll("nonExistentIds") Long nonExistentProductId,
            @ForAll("validDates") LocalDate transactionDate,
            @ForAll @Positive int quantity,
            @ForAll("validAmounts") BigDecimal totalAmount) {
        
        // Arrange
        SalesTransaction transaction = new SalesTransaction(
            nonExistentCustomerId,
            nonExistentProductId,
            transactionDate,
            quantity,
            totalAmount
        );

        // Act & Assert
        // The database should reject this transaction due to foreign key constraint violation
        Exception exception = assertThrows(
            DataIntegrityViolationException.class,
            () -> {
                salesRepository.save(transaction);
                salesRepository.flush(); // Force immediate database interaction
            }
        );
        
        // Verify the exception is related to foreign key constraint
        String message = exception.getMessage().toLowerCase();
        assertTrue(
            message.contains("foreign key") || 
            message.contains("constraint") || 
            message.contains("cannot add or update"),
            "Exception should indicate foreign key constraint violation"
        );
    }

    // Arbitraries (Generators)

    /**
     * Generates non-existent IDs that are very unlikely to exist in the database.
     * Uses large numbers (10000000+) to avoid collision with test data.
     */
    @Provide
    Arbitrary<Long> nonExistentIds() {
        return Arbitraries.longs()
            .between(10_000_000L, 99_999_999L);
    }

    /**
     * Generates valid transaction dates within a reasonable range.
     */
    @Provide
    Arbitrary<LocalDate> validDates() {
        return Arbitraries.integers()
            .between(2020, 2025)
            .flatMap(year -> Arbitraries.integers()
                .between(1, 12)
                .flatMap(month -> Arbitraries.integers()
                    .between(1, 28) // Use 28 to avoid invalid dates
                    .map(day -> LocalDate.of(year, month, day))));
    }

    /**
     * Generates valid transaction amounts.
     */
    @Provide
    Arbitrary<BigDecimal> validAmounts() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.valueOf(0.01), BigDecimal.valueOf(100000.00))
            .ofScale(2);
    }
}
