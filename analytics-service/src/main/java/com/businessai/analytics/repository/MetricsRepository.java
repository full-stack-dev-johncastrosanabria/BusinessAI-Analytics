package com.businessai.analytics.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.businessai.analytics.entity.BusinessMetric;

@Repository
public interface MetricsRepository extends JpaRepository<BusinessMetric, Long> {

    /**
     * Find a business metric by month and year
     */
    Optional<BusinessMetric> findByMonthAndYear(Integer month, Integer year);

    /**
     * Find all metrics within a date range (inclusive)
     * @param startYear the start year
     * @param startMonth the start month
     * @param endYear the end year
     * @param endMonth the end month
     * @return list of metrics within the range
     */
    @Query("SELECT bm FROM BusinessMetric bm " +
           "WHERE (bm.year > :startYear OR (bm.year = :startYear AND bm.month >= :startMonth)) " +
           "AND (bm.year < :endYear OR (bm.year = :endYear AND bm.month <= :endMonth)) " +
           "ORDER BY bm.year ASC, bm.month ASC")
    List<BusinessMetric> findByDateRange(@Param("startYear") Integer startYear,
                                         @Param("startMonth") Integer startMonth,
                                         @Param("endYear") Integer endYear,
                                         @Param("endMonth") Integer endMonth);

    /**
     * Find all metrics for a specific year
     */
    List<BusinessMetric> findByYearOrderByMonthAsc(Integer year);

    /**
     * Find all metrics ordered by year and month
     */
    List<BusinessMetric> findAllByOrderByYearAscMonthAsc();
}
