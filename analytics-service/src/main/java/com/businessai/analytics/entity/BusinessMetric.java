package com.businessai.analytics.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "business_metrics", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"month", "year"}, name = "unique_month_year")
}, indexes = {
    @Index(columnList = "year, month", name = "idx_year_month")
})
public class BusinessMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "total_sales", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalSales;

    @Column(name = "total_costs", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalCosts;

    @Column(name = "total_expenses", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalExpenses;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal profit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public BusinessMetric() {
    }

    public BusinessMetric(Integer month, Integer year, BigDecimal totalSales, 
                         BigDecimal totalCosts, BigDecimal totalExpenses) {
        this.month = month;
        this.year = year;
        this.totalSales = totalSales;
        this.totalCosts = totalCosts;
        this.totalExpenses = totalExpenses;
        this.profit = calculateProfit(totalSales, totalCosts, totalExpenses);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public BigDecimal getTotalCosts() {
        return totalCosts;
    }

    public void setTotalCosts(BigDecimal totalCosts) {
        this.totalCosts = totalCosts;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public BigDecimal getProfit() {
        return profit;
    }

    public void setProfit(BigDecimal profit) {
        this.profit = profit;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Helper method for profit calculation
    public static BigDecimal calculateProfit(BigDecimal totalSales, BigDecimal totalCosts, BigDecimal totalExpenses) {
        return totalSales.subtract(totalCosts).subtract(totalExpenses);
    }

    @Override
    public String toString() {
        return "BusinessMetric{" +
                "id=" + id +
                ", month=" + month +
                ", year=" + year +
                ", totalSales=" + totalSales +
                ", totalCosts=" + totalCosts +
                ", totalExpenses=" + totalExpenses +
                ", profit=" + profit +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
