package com.businessai.sales.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for SalesTransaction entity.
 */
class SalesTransactionTest {

    @Test
    void testSalesTransactionCreation() {
        // Given
        Long customerId = 1L;
        Long productId = 2L;
        LocalDate transactionDate = LocalDate.of(2024, 1, 15);
        Integer quantity = 3;
        BigDecimal totalAmount = new BigDecimal("150.00");

        // When
        SalesTransaction transaction = new SalesTransaction(
                customerId, productId, transactionDate, quantity, totalAmount);

        // Then
        assertNotNull(transaction);
        assertEquals(customerId, transaction.getCustomerId());
        assertEquals(productId, transaction.getProductId());
        assertEquals(transactionDate, transaction.getTransactionDate());
        assertEquals(quantity, transaction.getQuantity());
        assertEquals(totalAmount, transaction.getTotalAmount());
        assertNull(transaction.getId()); // ID not set until persisted
    }

    @Test
    void testSalesTransactionSetters() {
        // Given
        SalesTransaction transaction = new SalesTransaction();

        // When
        transaction.setCustomerId(5L);
        transaction.setProductId(10L);
        transaction.setTransactionDate(LocalDate.of(2024, 2, 20));
        transaction.setQuantity(2);
        transaction.setTotalAmount(new BigDecimal("200.00"));

        // Then
        assertEquals(5L, transaction.getCustomerId());
        assertEquals(10L, transaction.getProductId());
        assertEquals(LocalDate.of(2024, 2, 20), transaction.getTransactionDate());
        assertEquals(2, transaction.getQuantity());
        assertEquals(new BigDecimal("200.00"), transaction.getTotalAmount());
    }

    @Test
    void testSalesTransactionEquality() {
        // Given
        SalesTransaction transaction1 = new SalesTransaction();
        transaction1.setId(1L);

        SalesTransaction transaction2 = new SalesTransaction();
        transaction2.setId(1L);

        SalesTransaction transaction3 = new SalesTransaction();
        transaction3.setId(2L);

        // Then
        assertEquals(transaction1, transaction2);
        assertNotEquals(transaction1, transaction3);
        assertEquals(transaction1.hashCode(), transaction2.hashCode());
    }

    @Test
    void testSalesTransactionToString() {
        // Given
        SalesTransaction transaction = new SalesTransaction(
                1L, 2L, LocalDate.of(2024, 1, 15), 3, new BigDecimal("150.00"));
        transaction.setId(100L);

        // When
        String toString = transaction.toString();

        // Then
        assertNotNull(toString);
        assertTrue(toString.contains("id=100"));
        assertTrue(toString.contains("customerId=1"));
        assertTrue(toString.contains("productId=2"));
        assertTrue(toString.contains("quantity=3"));
        assertTrue(toString.contains("totalAmount=150.00"));
    }
}
