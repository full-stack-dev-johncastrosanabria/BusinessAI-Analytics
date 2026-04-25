package com.businessai.analytics.controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
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

import com.businessai.analytics.entity.BusinessMetric;
import com.businessai.analytics.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(AnalyticsController.class)
public class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

    @Autowired
    private ObjectMapper objectMapper;

    private BusinessMetric testMetric;

    @BeforeEach
    public void setUp() {
        testMetric = new BusinessMetric(1, 2024, 
                BigDecimal.valueOf(50000), 
                BigDecimal.valueOf(30000), 
                BigDecimal.valueOf(10000));
        testMetric.setId(1L);
    }

    @Test
    public void testCreateMetric_Success() throws Exception {
        when(analyticsService.createMetric(1, 2024, 
                BigDecimal.valueOf(50000), 
                BigDecimal.valueOf(30000), 
                BigDecimal.valueOf(10000)))
                .thenReturn(testMetric);

        AnalyticsController.CreateMetricRequest request = new AnalyticsController.CreateMetricRequest();
        request.setMonth(1);
        request.setYear(2024);
        request.setTotalSales(BigDecimal.valueOf(50000));
        request.setTotalCosts(BigDecimal.valueOf(30000));
        request.setTotalExpenses(BigDecimal.valueOf(10000));

        mockMvc.perform(post("/api/analytics/metrics")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.month", is(1)))
                .andExpect(jsonPath("$.year", is(2024)))
                .andExpect(jsonPath("$.totalSales", is(50000)))
                .andExpect(jsonPath("$.profit", is(10000)));

        verify(analyticsService, times(1)).createMetric(1, 2024, 
                BigDecimal.valueOf(50000), 
                BigDecimal.valueOf(30000), 
                BigDecimal.valueOf(10000));
    }

    @Test
    public void testCreateMetric_ValidationError() throws Exception {
        when(analyticsService.createMetric(anyInt(), anyInt(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Month must be between 1 and 12"));

        AnalyticsController.CreateMetricRequest request = new AnalyticsController.CreateMetricRequest();
        request.setMonth(13);
        request.setYear(2024);
        request.setTotalSales(BigDecimal.valueOf(50000));
        request.setTotalCosts(BigDecimal.valueOf(30000));
        request.setTotalExpenses(BigDecimal.valueOf(10000));

        mockMvc.perform(post("/api/analytics/metrics")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation failed")))
                .andExpect(jsonPath("$.message", containsString("Month must be between 1 and 12")));
    }

    @Test
    public void testGetAllMetrics() throws Exception {
        List<BusinessMetric> metrics = new ArrayList<>();
        metrics.add(testMetric);

        when(analyticsService.getAllMetrics()).thenReturn(metrics);

        mockMvc.perform(get("/api/analytics/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].month", is(1)))
                .andExpect(jsonPath("$[0].year", is(2024)));

        verify(analyticsService, times(1)).getAllMetrics();
    }

    @Test
    public void testGetMetricsByDateRange() throws Exception {
        List<BusinessMetric> metrics = new ArrayList<>();
        metrics.add(testMetric);

        when(analyticsService.getMetricsByDateRange(2024, 1, 2024, 12))
                .thenReturn(metrics);

        mockMvc.perform(get("/api/analytics/metrics")
                .param("startYear", "2024")
                .param("startMonth", "1")
                .param("endYear", "2024")
                .param("endMonth", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)));

        verify(analyticsService, times(1)).getMetricsByDateRange(2024, 1, 2024, 12);
    }

    @Test
    public void testGetMetricById_Success() throws Exception {
        when(analyticsService.getMetricById(1L)).thenReturn(testMetric);

        mockMvc.perform(get("/api/analytics/metrics/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.month", is(1)))
                .andExpect(jsonPath("$.year", is(2024)));

        verify(analyticsService, times(1)).getMetricById(1L);
    }

    @Test
    public void testGetMetricById_NotFound() throws Exception {
        when(analyticsService.getMetricById(999L))
                .thenThrow(new IllegalArgumentException("Metric not found with id: 999"));

        mockMvc.perform(get("/api/analytics/metrics/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not found")))
                .andExpect(jsonPath("$.message", containsString("Metric not found")));
    }

    @Test
    public void testUpdateMetric_Success() throws Exception {
        BusinessMetric updatedMetric = new BusinessMetric(1, 2024,
                BigDecimal.valueOf(60000),
                BigDecimal.valueOf(35000),
                BigDecimal.valueOf(10000));
        updatedMetric.setId(1L);

        when(analyticsService.updateMetric(1L, 
                BigDecimal.valueOf(60000),
                BigDecimal.valueOf(35000),
                BigDecimal.valueOf(10000)))
                .thenReturn(updatedMetric);

        AnalyticsController.UpdateMetricRequest request = new AnalyticsController.UpdateMetricRequest();
        request.setTotalSales(BigDecimal.valueOf(60000));
        request.setTotalCosts(BigDecimal.valueOf(35000));
        request.setTotalExpenses(BigDecimal.valueOf(10000));

        mockMvc.perform(put("/api/analytics/metrics/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.totalSales", is(60000)));

        verify(analyticsService, times(1)).updateMetric(1L,
                BigDecimal.valueOf(60000),
                BigDecimal.valueOf(35000),
                BigDecimal.valueOf(10000));
    }

    @Test
    public void testDeleteMetric_Success() throws Exception {
        doNothing().when(analyticsService).deleteMetric(1L);

        mockMvc.perform(delete("/api/analytics/metrics/1"))
                .andExpect(status().isNoContent());

        verify(analyticsService, times(1)).deleteMetric(1L);
    }

    @Test
    public void testDeleteMetric_NotFound() throws Exception {
        doThrow(new IllegalArgumentException("Metric not found with id: 999"))
                .when(analyticsService).deleteMetric(999L);

        mockMvc.perform(delete("/api/analytics/metrics/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not found")));
    }

    @Test
    public void testGetDashboard_Success() throws Exception {
        AnalyticsService.DashboardSummary summary = new AnalyticsService.DashboardSummary(
                BigDecimal.valueOf(50000),
                BigDecimal.valueOf(30000),
                BigDecimal.valueOf(10000),
                testMetric,
                testMetric,
                new ArrayList<>()
        );

        when(analyticsService.getDashboardSummary(2024, 1, 2024, 12))
                .thenReturn(summary);

        mockMvc.perform(get("/api/analytics/dashboard")
                .param("startYear", "2024")
                .param("startMonth", "1")
                .param("endYear", "2024")
                .param("endMonth", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSales", is(50000)))
                .andExpect(jsonPath("$.totalCosts", is(30000)))
                .andExpect(jsonPath("$.totalProfit", is(10000)));

        verify(analyticsService, times(1)).getDashboardSummary(2024, 1, 2024, 12);
    }

    @Test
    public void testGetDashboard_DefaultDateRange() throws Exception {
        AnalyticsService.DashboardSummary summary = new AnalyticsService.DashboardSummary(
                BigDecimal.valueOf(50000),
                BigDecimal.valueOf(30000),
                BigDecimal.valueOf(10000),
                testMetric,
                testMetric,
                new ArrayList<>()
        );

        when(analyticsService.getDashboardSummary(2024, 1, 2024, 12))
                .thenReturn(summary);

        mockMvc.perform(get("/api/analytics/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSales", is(50000)));

        verify(analyticsService, times(1)).getDashboardSummary(2024, 1, 2024, 12);
    }

    @Test
    public void testAggregateData() throws Exception {
        mockMvc.perform(post("/api/analytics/aggregate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Aggregation triggered successfully")));
    }
}
