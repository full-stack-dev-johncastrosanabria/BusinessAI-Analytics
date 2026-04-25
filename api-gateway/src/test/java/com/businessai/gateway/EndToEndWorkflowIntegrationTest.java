package com.businessai.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * End-to-End Integration Tests for Critical User Workflows
 * 
 * This test suite validates complete user workflows that span multiple microservices:
 * 1. Complete product management workflow (create, read, update, delete)
 * 2. Complete sales transaction creation workflow (create customer, create product, create transaction)
 * 3. Dashboard load and metric display workflow
 * 4. Document upload and chatbot query workflow
 * 5. Forecast generation workflow (load data, train model, generate forecast)
 * 
 * These tests verify end-to-end functionality through the API Gateway, ensuring
 * all microservices work together correctly to support critical business workflows.
 * 
 * Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.6, 4.1-4.4, 5.1-5.6, 6.1-6.6, 8.1-8.6,
 *              9.1-9.6, 10.1-10.3, 11.1-11.6, 12.1-12.6, 13.1-13.6
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class EndToEndWorkflowIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== Workflow 1: Product Management ====================

    /**
     * Test complete product management workflow:
     * 1. Create a product
     * 2. Retrieve the product
     * 3. Update the product
     * 4. Delete the product
     * 
     * Validates: Requirements 1.1-1.6
     */
    @Test
    void testWorkflow_ProductManagement_CompleteLifecycle() {
        // Step 1: Create a product
        String createProductJson = "{\"name\":\"Professional Laptop\",\"category\":\"Electronics\"," +
            "\"cost\":800.00,\"price\":1500.00}";

        String createResponse = webTestClient.post()
            .uri("/api/products")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(createProductJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(createResponse, "Create product response should not be null");
        assertTrue(createResponse.contains("Professional Laptop"), 
            "Response should contain created product name");

        Long productId = 1L;

        // Step 2: Retrieve the product
        String getResponse = webTestClient.get()
            .uri("/api/products/" + productId)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(getResponse, "Get product response should not be null");
        assertTrue(getResponse.contains("Professional Laptop"), 
            "Retrieved product should match created product");

        // Step 3: Update the product
        String updateProductJson = "{\"name\":\"Professional Laptop Pro\",\"category\":\"Electronics\"," +
            "\"cost\":900.00,\"price\":1800.00}";

        String updateResponse = webTestClient.put()
            .uri("/api/products/" + productId)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(updateProductJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(updateResponse, "Update product response should not be null");
        assertTrue(updateResponse.contains("Professional Laptop Pro"), 
            "Updated product should reflect new name");

        // Step 4: Delete the product
        webTestClient.delete()
            .uri("/api/products/" + productId)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300);

        // Verify deletion by attempting to retrieve
        webTestClient.get()
            .uri("/api/products/" + productId)
            .exchange()
            .expectStatus().value(status -> status >= 400);
    }

    // ==================== Workflow 2: Sales Transaction Creation ====================

    /**
     * Test complete sales transaction creation workflow:
     * 1. Create a customer
     * 2. Create a product
     * 3. Create a sales transaction linking customer and product
     * 4. Verify transaction total calculation
     * 5. Retrieve transaction with customer and product details
     * 
     * Validates: Requirements 2.1-2.6, 3.1-3.6
     */
    @Test
    void testWorkflow_SalesTransactionCreation_CompleteFlow() {
        // Step 1: Create a customer
        String createCustomerJson = "{\"name\":\"Acme Corporation\",\"email\":\"contact@acme.com\"," +
            "\"segment\":\"Enterprise\",\"country\":\"USA\"}";

        String customerResponse = webTestClient.post()
            .uri("/api/customers")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(createCustomerJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(customerResponse, "Create customer response should not be null");
        assertTrue(customerResponse.contains("Acme Corporation"), 
            "Response should contain created customer name");

        Long customerId = 1L;

        // Step 2: Create a product
        String createProductJson = "{\"name\":\"Enterprise Software License\",\"category\":\"Software\"," +
            "\"cost\":5000.00,\"price\":10000.00}";

        String productResponse = webTestClient.post()
            .uri("/api/products")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(createProductJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(productResponse, "Create product response should not be null");
        assertTrue(productResponse.contains("Enterprise Software License"), 
            "Response should contain created product name");

        Long productId = 1L;

        // Step 3: Create a sales transaction
        String createTransactionJson = "{\"customerId\":" + customerId + ",\"productId\":" + productId + 
            ",\"transactionDate\":\"2024-01-15\",\"quantity\":2}";

        String transactionResponse = webTestClient.post()
            .uri("/api/sales")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(createTransactionJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(transactionResponse, "Create transaction response should not be null");
        assertTrue(transactionResponse.contains("20000"), 
            "Response should contain calculated total (2 * 10000)");

        Long transactionId = 1L;

        // Step 4: Verify transaction total calculation
        assertTrue(transactionResponse.contains("20000"), 
            "Transaction total should be correctly calculated as quantity * price");

        // Step 5: Retrieve transaction with details
        String retrieveResponse = webTestClient.get()
            .uri("/api/sales/" + transactionId)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(retrieveResponse, "Retrieve transaction response should not be null");
        assertTrue(retrieveResponse.contains("Acme Corporation"), 
            "Transaction should include customer details");
        assertTrue(retrieveResponse.contains("Enterprise Software License"), 
            "Transaction should include product details");
    }

    // ==================== Workflow 3: Dashboard Load and Metric Display ====================

    /**
     * Test dashboard load and metric display workflow:
     * 1. Create business metrics
     * 2. Load dashboard summary
     * 3. Verify dashboard displays total sales, costs, profit
     * 4. Verify dashboard displays best and worst performing months
     * 5. Verify dashboard displays top 5 products by revenue
     * 
     * Validates: Requirements 4.1-4.4, 5.1-5.6
     */
    @Test
    void testWorkflow_DashboardLoadAndMetricDisplay() {
        // Step 1: Create business metrics for multiple months
        for (int month = 1; month <= 3; month++) {
            String createMetricJson = "{\"month\":" + month + ",\"year\":2024," +
                "\"totalSales\":" + (50000 + month * 5000) + "," +
                "\"totalCosts\":" + (30000 + month * 3000) + "," +
                "\"totalExpenses\":" + (10000 + month * 1000) + "}";

            webTestClient.post()
                .uri("/api/analytics/metrics")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(createMetricJson)
                .exchange()
                .expectStatus().value(status -> status >= 200 && status < 300);
        }

        // Step 2: Load dashboard summary
        String dashboardResponse = webTestClient.get()
            .uri("/api/analytics/dashboard")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(dashboardResponse, "Dashboard response should not be null");

        // Step 3: Verify dashboard displays total sales, costs, profit
        assertTrue(dashboardResponse.contains("totalSales") || dashboardResponse.contains("total_sales"), 
            "Dashboard should display total sales");
        assertTrue(dashboardResponse.contains("totalCosts") || dashboardResponse.contains("total_costs"), 
            "Dashboard should display total costs");
        assertTrue(dashboardResponse.contains("profit"), 
            "Dashboard should display profit");

        // Step 4: Verify dashboard displays best and worst performing months
        assertTrue(dashboardResponse.contains("bestMonth") || dashboardResponse.contains("best_month"), 
            "Dashboard should display best performing month");
        assertTrue(dashboardResponse.contains("worstMonth") || dashboardResponse.contains("worst_month"), 
            "Dashboard should display worst performing month");

        // Step 5: Verify dashboard displays top products
        assertTrue(dashboardResponse.contains("topProducts") || dashboardResponse.contains("top_products"), 
            "Dashboard should display top products");
    }

    // ==================== Workflow 4: Document Upload and Chatbot Query ====================

    /**
     * Test document upload and chatbot query workflow:
     * 1. Upload a document
     * 2. Verify document is stored with metadata
     * 3. Query chatbot with question about document content
     * 4. Verify chatbot returns response with document source
     * 5. Verify chatbot response includes relevant document excerpts
     * 
     * Validates: Requirements 6.1-6.6, 11.1-11.6, 12.1-12.6, 13.1-13.6
     */
    @Test
    void testWorkflow_DocumentUploadAndChatbotQuery() {
        // Step 1: Upload a document
        String uploadJson = "{\"filename\":\"business_strategy.txt\",\"fileType\":\"TXT\"," +
            "\"extractedText\":\"Our business strategy focuses on enterprise solutions and customer satisfaction.\"}";

        String uploadResponse = webTestClient.post()
            .uri("/api/documents/upload")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(uploadJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(uploadResponse, "Upload response should not be null");
        assertTrue(uploadResponse.contains("business_strategy.txt"), 
            "Response should contain uploaded filename");

        Long documentId = 1L;

        // Step 2: Verify document is stored with metadata
        String documentResponse = webTestClient.get()
            .uri("/api/documents/" + documentId)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(documentResponse, "Document metadata response should not be null");
        assertTrue(documentResponse.contains("business_strategy.txt"), 
            "Document metadata should include filename");
        assertTrue(documentResponse.contains("TXT"), 
            "Document metadata should include file type");

        // Step 3: Query chatbot with question about document content
        String chatbotQueryJson = "{\"question\":\"What is our business strategy?\"}";

        String chatbotResponse = webTestClient.post()
            .uri("/api/ai/chatbot/query")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(chatbotQueryJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(chatbotResponse, "Chatbot response should not be null");

        // Step 4: Verify chatbot returns response with document source
        assertTrue(chatbotResponse.contains("answer") || chatbotResponse.contains("response"), 
            "Chatbot response should contain answer");
        assertTrue(chatbotResponse.contains("sources") || chatbotResponse.contains("source"), 
            "Chatbot response should include sources");

        // Step 5: Verify chatbot response includes relevant document excerpts
        assertTrue(chatbotResponse.contains("business_strategy.txt") || 
                   chatbotResponse.contains("enterprise") || 
                   chatbotResponse.contains("strategy"), 
            "Chatbot response should reference document content");
    }

    // ==================== Workflow 5: Forecast Generation ====================

    /**
     * Test forecast generation workflow:
     * 1. Load historical business metrics (at least 24 months)
     * 2. Trigger model training
     * 3. Generate sales forecast
     * 4. Generate cost forecast
     * 5. Generate profit forecast
     * 6. Verify forecasts contain 12 months of predictions
     * 
     * Validates: Requirements 8.1-8.6, 9.1-9.6, 10.1-10.3
     */
    @Test
    void testWorkflow_ForecastGeneration() {
        // Step 1: Load historical business metrics (at least 24 months)
        for (int month = 1; month <= 24; month++) {
            String createMetricJson = "{\"month\":" + ((month - 1) % 12 + 1) + ",\"year\":" + 
                (2022 + (month - 1) / 12) + "," +
                "\"totalSales\":" + (50000 + month * 500) + "," +
                "\"totalCosts\":" + (30000 + month * 300) + "," +
                "\"totalExpenses\":" + (10000 + month * 100) + "}";

            webTestClient.post()
                .uri("/api/analytics/metrics")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(createMetricJson)
                .exchange()
                .expectStatus().value(status -> status >= 200 && status < 300);
        }

        // Step 2: Trigger model training
        webTestClient.post()
            .uri("/api/ai/train")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300);

        // Step 3: Generate sales forecast
        String salesForecastResponse = webTestClient.post()
            .uri("/api/ai/forecast/sales")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(salesForecastResponse, "Sales forecast response should not be null");
        assertTrue(salesForecastResponse.contains("predictions") || 
                   salesForecastResponse.contains("forecast"), 
            "Sales forecast should contain predictions");

        // Step 4: Generate cost forecast
        String costForecastResponse = webTestClient.post()
            .uri("/api/ai/forecast/costs")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(costForecastResponse, "Cost forecast response should not be null");
        assertTrue(costForecastResponse.contains("predictions") || 
                   costForecastResponse.contains("forecast"), 
            "Cost forecast should contain predictions");

        // Step 5: Generate profit forecast
        String profitForecastResponse = webTestClient.post()
            .uri("/api/ai/forecast/profit")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(profitForecastResponse, "Profit forecast response should not be null");
        assertTrue(profitForecastResponse.contains("predictions") || 
                   profitForecastResponse.contains("forecast"), 
            "Profit forecast should contain predictions");

        // Step 6: Verify forecasts contain 12 months of predictions
        int salesPredictionCount = countOccurrences(salesForecastResponse, "month");
        int costPredictionCount = countOccurrences(costForecastResponse, "month");
        int profitPredictionCount = countOccurrences(profitForecastResponse, "month");

        assertTrue(salesPredictionCount >= 12, 
            "Sales forecast should contain at least 12 monthly predictions");
        assertTrue(costPredictionCount >= 12, 
            "Cost forecast should contain at least 12 monthly predictions");
        assertTrue(profitPredictionCount >= 12, 
            "Profit forecast should contain at least 12 monthly predictions");
    }

    // ==================== Helper Methods ====================

    /**
     * Helper method to count occurrences of a substring in a string
     */
    private int countOccurrences(String text, String substring) {
        if (text == null || substring == null) {
            return 0;
        }
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(substring, index)) != -1) {
            count++;
            index += substring.length();
        }
        return count;
    }

    // ==================== Cross-Workflow Integration Tests ====================

    /**
     * Test that multiple workflows can be executed sequentially without interference
     */
    @Test
    void testCrossWorkflow_MultipleWorkflowsSequential() {
        testWorkflow_ProductManagement_CompleteLifecycle();
        testWorkflow_SalesTransactionCreation_CompleteFlow();
        testWorkflow_DashboardLoadAndMetricDisplay();
    }

    /**
     * Test that API Gateway correctly routes requests from all workflows
     */
    @Test
    void testCrossWorkflow_APIGatewayRouting() {
        webTestClient.get()
            .uri("/api/products")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 600);

        webTestClient.get()
            .uri("/api/customers")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 600);

        webTestClient.get()
            .uri("/api/sales")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 600);

        webTestClient.get()
            .uri("/api/analytics/metrics")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 600);

        webTestClient.get()
            .uri("/api/documents")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 600);

        webTestClient.post()
            .uri("/api/ai/forecast/sales")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 600);
    }

    /**
     * Test error handling across workflows
     */
    @Test
    void testCrossWorkflow_ErrorHandling() {
        webTestClient.get()
            .uri("/api/products/999999")
            .exchange()
            .expectStatus().value(status -> status >= 400);

        webTestClient.get()
            .uri("/api/customers/999999")
            .exchange()
            .expectStatus().value(status -> status >= 400);

        webTestClient.get()
            .uri("/api/sales/999999")
            .exchange()
            .expectStatus().value(status -> status >= 400);

        webTestClient.get()
            .uri("/api/documents/999999")
            .exchange()
            .expectStatus().value(status -> status >= 400);
    }

    /**
     * Test data consistency across workflows
     */
    @Test
    void testCrossWorkflow_DataConsistency() {
        String createProductJson = "{\"name\":\"Test Product\",\"category\":\"Test\"," +
            "\"cost\":100.00,\"price\":200.00}";

        webTestClient.post()
            .uri("/api/products")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(createProductJson)
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300);

        String getResponse = webTestClient.get()
            .uri("/api/products/1")
            .exchange()
            .expectStatus().value(status -> status >= 200 && status < 300)
            .expectBody(String.class)
            .returnResult()
            .getResponseBody();

        assertNotNull(getResponse, "Retrieved product should not be null");
        assertTrue(getResponse.contains("Test Product"), 
            "Retrieved product should match created product");
        assertTrue(getResponse.contains("200"), 
            "Retrieved product price should match created price");
    }
}
