package com.businessai.sales.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.businessai.sales.entity.SalesTransaction;

/**
 * Repository interface for SalesTransaction entity.
 * Provides CRUD operations and custom query methods for filtering sales transactions.
 */
@Repository
public interface SalesRepository extends JpaRepository<SalesTransaction, Long> {

    /**
     * Find all sales transactions within a date range.
     *
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of sales transactions within the date range
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.transactionDate BETWEEN :startDate AND :endDate ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByTransactionDateBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find all sales transactions for a specific customer.
     *
     * @param customerId the customer ID
     * @return list of sales transactions for the customer
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.customerId = :customerId ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByCustomerId(@Param("customerId") Long customerId);

    /**
     * Find all sales transactions for a specific product.
     *
     * @param productId the product ID
     * @return list of sales transactions for the product
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.productId = :productId ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByProductId(@Param("productId") Long productId);

    /**
     * Find all sales transactions for a specific customer within a date range.
     *
     * @param customerId the customer ID
     * @param startDate  the start date (inclusive)
     * @param endDate    the end date (inclusive)
     * @return list of sales transactions for the customer within the date range
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.customerId = :customerId " +
           "AND st.transactionDate BETWEEN :startDate AND :endDate ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByCustomerIdAndDateBetween(
            @Param("customerId") Long customerId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find all sales transactions for a specific product within a date range.
     *
     * @param productId the product ID
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @return list of sales transactions for the product within the date range
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.productId = :productId " +
           "AND st.transactionDate BETWEEN :startDate AND :endDate ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByProductIdAndDateBetween(
            @Param("productId") Long productId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find all sales transactions for a specific customer and product.
     *
     * @param customerId the customer ID
     * @param productId  the product ID
     * @return list of sales transactions for the customer and product
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.customerId = :customerId " +
           "AND st.productId = :productId ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByCustomerIdAndProductId(
            @Param("customerId") Long customerId,
            @Param("productId") Long productId);

    /**
     * Find all sales transactions for a specific customer and product within a date range.
     *
     * @param customerId the customer ID
     * @param productId  the product ID
     * @param startDate  the start date (inclusive)
     * @param endDate    the end date (inclusive)
     * @return list of sales transactions for the customer and product within the date range
     */
    @Query("SELECT st FROM SalesTransaction st WHERE st.customerId = :customerId " +
           "AND st.productId = :productId " +
           "AND st.transactionDate BETWEEN :startDate AND :endDate ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findByCustomerIdAndProductIdAndDateBetween(
            @Param("customerId") Long customerId,
            @Param("productId") Long productId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find all sales transactions ordered by date descending.
     *
     * @return list of all sales transactions ordered by date
     */
    @Query("SELECT st FROM SalesTransaction st ORDER BY st.transactionDate DESC")
    List<SalesTransaction> findAllOrderByDateDesc();
}
