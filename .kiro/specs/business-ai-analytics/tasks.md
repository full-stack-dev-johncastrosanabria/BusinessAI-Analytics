# Implementation Plan: BusinessAI-Analytics Platform

## Overview

This implementation plan breaks down the BusinessAI-Analytics platform into discrete, actionable coding tasks. The platform consists of:
- **Backend**: 5 Spring Boot microservices (Product, Customer, Sales, Analytics, Document) + API Gateway (Java 17)
- **AI Service**: FastAPI service with PyTorch/TensorFlow forecasting models (Python 3.9+)
- **Frontend**: React TypeScript SPA
- **Database**: MySQL 8.0 with shared schema

The implementation follows a bottom-up approach: database → microservices → AI service → frontend → integration.

## Tasks

- [x] 1. Set up database schema and seed data
  - [x] 1.1 Create MySQL database schema with all tables
    - Create tables: products, customers, sales_transactions, business_metrics, documents
    - Add foreign key constraints, indexes, and appropriate data types
    - Ensure schema script is idempotent (can run multiple times safely)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [x] 1.2 Write property test for schema idempotence
    - **Property 21: Schema Script Idempotence**
    - **Validates: Requirements 16.6**
    - Test that running schema script multiple times produces same result
  
  - [x] 1.3 Create synthetic data generation script
    - Generate 30 products across 5 categories
    - Generate 100 customers across 3 segments and 10 countries
    - Generate 5000 sales transactions spanning 5 years with realistic trends
    - Generate 60 business metrics (5 years of monthly data)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 2. Implement API Gateway service
  - [x] 2.1 Create Spring Boot API Gateway project structure
    - Set up Spring Cloud Gateway dependencies
    - Configure application.yml with port 8080
    - Create main application class
    - _Requirements: 21.3, 21.6_
  
  - [x] 2.2 Configure route predicates for all microservices
    - Route /api/products/** to Product Service (8081)
    - Route /api/customers/** to Customer Service (8082)
    - Route /api/sales/** to Sales Service (8083)
    - Route /api/analytics/** to Analytics Service (8084)
    - Route /api/documents/** to Document Service (8085)
    - Route /api/ai/** to AI Service (8000)
    - _Requirements: 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_
  
  - [x] 2.3 Implement cross-cutting concerns (CORS, logging, error handling)
    - Add CORS configuration for frontend (port 5173)
    - Add request/response logging filter
    - Add global error handler with standardized error responses
    - _Requirements: 17.8_
  
  - [x] 2.4 Write property test for API Gateway status codes
    - **Property 22: API Gateway Status Code Correctness**
    - **Validates: Requirements 17.8**
    - Test that gateway returns correct HTTP status codes (200, 400, 404, 500)

- [x] 3. Implement Product Service microservice
  - [x] 3.1 Create Spring Boot Product Service project structure
    - Set up Spring Boot dependencies (Web, JPA, MySQL)
    - Configure application.yml with port 8081 and database connection
    - Create main application class
    - _Requirements: 21.1, 21.4, 21.5, 21.7_
  
  - [x] 3.2 Create Product entity and repository
    - Define Product JPA entity with fields: id, name, category, cost, price, timestamps
    - Create ProductRepository extending JpaRepository
    - _Requirements: 1.1_
  
  - [x] 3.3 Implement Product service layer with validation
    - Create ProductService with CRUD business logic
    - Add validation for required fields (name, category, cost, price)
    - Add validation for positive cost and price values
    - _Requirements: 1.2_
  
  - [x] 3.4 Write property test for product validation
    - **Property 1: Product Validation Rejects Invalid Data**
    - **Validates: Requirements 1.2**
    - Test that invalid products are rejected with appropriate errors
  
  - [x] 3.5 Write property test for product CRUD round-trip
    - **Property 2: Product CRUD Round-Trip Preserves Data**
    - **Validates: Requirements 1.3, 1.4**
    - Test that create→retrieve and create→update→retrieve preserve data
  
  - [x] 3.6 Implement Product REST controller
    - POST /api/products - Create product
    - GET /api/products/{id} - Retrieve product by ID
    - GET /api/products - List all products
    - PUT /api/products/{id} - Update product
    - DELETE /api/products/{id} - Delete product
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.7 Write unit tests for Product controller endpoints
    - Test all CRUD operations with MockMvc
    - Test validation error responses
    - Test 404 responses for non-existent products

- [x] 4. Implement Customer Service microservice
  - [x] 4.1 Create Spring Boot Customer Service project structure
    - Set up Spring Boot dependencies (Web, JPA, MySQL)
    - Configure application.yml with port 8082 and database connection
    - Create main application class
    - _Requirements: 21.1, 21.4, 21.5, 21.7_
  
  - [x] 4.2 Create Customer entity and repository
    - Define Customer JPA entity with fields: id, name, email, segment, country, timestamps
    - Add unique constraint on email field
    - Create CustomerRepository extending JpaRepository
    - _Requirements: 2.1_
  
  - [x] 4.3 Implement Customer service layer with email validation
    - Create CustomerService with CRUD business logic
    - Add email format validation (must contain @ and domain)
    - Add validation for required fields
    - _Requirements: 2.2_
  
  - [x] 4.4 Write property test for customer email validation
    - **Property 3: Customer Email Validation**
    - **Validates: Requirements 2.2**
    - Test that valid emails are accepted and invalid emails are rejected
  
  - [x] 4.5 Write property test for customer CRUD round-trip
    - **Property 4: Customer CRUD Round-Trip Preserves Data**
    - **Validates: Requirements 2.3, 2.4**
    - Test that create→retrieve and create→update→retrieve preserve data
  
  - [x] 4.6 Implement Customer REST controller
    - POST /api/customers - Create customer
    - GET /api/customers/{id} - Retrieve customer by ID
    - GET /api/customers - List all customers
    - PUT /api/customers/{id} - Update customer
    - DELETE /api/customers/{id} - Delete customer
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [x] 4.7 Write unit tests for Customer controller endpoints
    - Test all CRUD operations with MockMvc
    - Test email validation error responses
    - Test unique email constraint violations

- [x] 5. Checkpoint - Ensure Product and Customer services are working
  - Ensure all tests pass, ask the user if questions arise.

- [~] 6. Implement Sales Service microservice
  - [x] 6.1 Create Spring Boot Sales Service project structure
    - Set up Spring Boot dependencies (Web, JPA, MySQL)
    - Configure application.yml with port 8083 and database connection
    - Create main application class
    - _Requirements: 21.1, 21.4, 21.5, 21.7_
  
  - [x] 6.2 Create SalesTransaction entity and repository
    - Define SalesTransaction JPA entity with fields: id, customerId, productId, transactionDate, quantity, totalAmount, timestamps
    - Add foreign key constraints to customers and products tables
    - Create SalesRepository with custom query methods for filtering
    - Add indexes on transactionDate, customerId, productId
    - _Requirements: 3.1, 16.2, 16.3_
  
  - [x] 6.3 Write property test for foreign key constraint enforcement
    - **Property 20: Foreign Key Constraint Enforcement**
    - **Validates: Requirements 16.2, 16.3**
    - Test that transactions with non-existent customer/product IDs are rejected
  
  - [x] 6.4 Implement REST clients for Product and Customer services
    - Create ProductClient using RestTemplate or WebClient
    - Create CustomerClient using RestTemplate or WebClient
    - Add error handling for service communication failures
    - _Requirements: 21.8_
  
  - [x] 6.5 Implement Sales service layer with validation and calculation
    - Create SalesService with transaction creation logic
    - Validate customer exists by calling Customer Service
    - Validate product exists by calling Product Service
    - Calculate total amount as quantity × product price
    - Implement filtering by date range, customer ID, product ID
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [x] 6.6 Write property test for sales transaction reference validation
    - **Property 5: Sales Transaction Reference Validation**
    - **Validates: Requirements 3.2**
    - Test that transactions with invalid references are rejected
  
  - [~] 6.7 Write property test for sales transaction total calculation
    - **Property 6: Sales Transaction Total Calculation**
    - **Validates: Requirements 3.3**
    - Test that total amount equals quantity × price for all valid inputs
  
  - [~] 6.8 Write property test for sales transaction filtering
    - **Property 7: Sales Transaction Filtering Correctness**
    - **Validates: Requirements 3.5**
    - Test that filtered results match specified criteria (date, customer, product)
  
  - [~] 6.9 Implement Sales REST controller
    - POST /api/sales - Create sales transaction
    - GET /api/sales/{id} - Retrieve transaction by ID
    - GET /api/sales - List transactions with optional filters
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [~] 6.10 Write integration tests for Sales Service
    - Test inter-service communication with Product and Customer services
    - Test end-to-end transaction creation flow
    - Test validation error scenarios

- [~] 7. Implement Analytics Service microservice
  - [~] 7.1 Create Spring Boot Analytics Service project structure
    - Set up Spring Boot dependencies (Web, JPA, MySQL)
    - Configure application.yml with port 8084 and database connection
    - Create main application class
    - _Requirements: 21.1, 21.4, 21.5, 21.7_
  
  - [~] 7.2 Create BusinessMetric entity and repository
    - Define BusinessMetric JPA entity with fields: id, month, year, totalSales, totalCosts, totalExpenses, profit, timestamps
    - Add unique constraint on (month, year) combination
    - Create MetricsRepository with date range query methods
    - Add index on (year, month)
    - _Requirements: 4.1_
  
  - [~] 7.3 Implement Analytics service layer with calculations
    - Create AnalyticsService with CRUD business logic
    - Implement profit calculation: profit = totalSales - totalCosts - totalExpenses
    - Implement date range filtering for metrics
    - Implement sales aggregation from transactions to metrics
    - Implement dashboard summary calculations (best/worst months, top products)
    - _Requirements: 4.2, 4.3, 4.4, 5.2, 5.3_
  
  - [~] 7.4 Write property test for business metric profit calculation
    - **Property 8: Business Metric Profit Calculation**
    - **Validates: Requirements 4.2**
    - Test that profit equals totalSales - totalCosts - totalExpenses
  
  - [~] 7.5 Write property test for business metric date range filtering
    - **Property 9: Business Metric Date Range Filtering**
    - **Validates: Requirements 4.3**
    - Test that filtered metrics fall within specified date range
  
  - [~] 7.6 Write property test for sales aggregation accuracy
    - **Property 10: Sales Aggregation Accuracy**
    - **Validates: Requirements 4.4**
    - Test that aggregated sales equal sum of transaction amounts for a month
  
  - [~] 7.7 Write property test for dashboard best/worst month identification
    - **Property 11: Dashboard Best and Worst Month Identification**
    - **Validates: Requirements 5.2**
    - Test that best month has max profit and worst month has min profit
  
  - [~] 7.8 Write property test for dashboard top products ranking
    - **Property 12: Dashboard Top Products Ranking**
    - **Validates: Requirements 5.3**
    - Test that top 5 products are correctly sorted by revenue
  
  - [~] 7.9 Implement Analytics REST controller
    - POST /api/analytics/metrics - Create business metric
    - GET /api/analytics/metrics - List metrics with date range filter
    - GET /api/analytics/dashboard - Get dashboard summary
    - POST /api/analytics/aggregate - Trigger sales data aggregation
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3_
  
  - [~] 7.10 Write unit tests for Analytics controller endpoints
    - Test metric CRUD operations
    - Test dashboard summary calculations
    - Test aggregation endpoint

- [~] 8. Checkpoint - Ensure Sales and Analytics services are working
  - Ensure all tests pass, ask the user if questions arise.

- [~] 9. Implement Document Service microservice
  - [~] 9.1 Create Spring Boot Document Service project structure
    - Set up Spring Boot dependencies (Web, JPA, MySQL)
    - Add Apache POI dependencies for DOCX and XLSX extraction
    - Add Apache PDFBox dependency for PDF extraction
    - Configure application.yml with port 8085 and database connection
    - Create main application class
    - _Requirements: 21.1, 21.4, 21.5, 21.7_
  
  - [~] 9.2 Create Document entity and repository
    - Define Document JPA entity with fields: id, filename, uploadDate, fileSize, fileType, extractedText, extractionStatus, errorMessage
    - Add indexes on fileType and extractionStatus
    - Add fulltext index on extractedText
    - Create DocumentRepository extending JpaRepository
    - _Requirements: 6.5_
  
  - [~] 9.3 Implement text extraction component
    - Create TextExtractor component with methods for each file type
    - Implement TXT extraction using Java I/O
    - Implement DOCX extraction using Apache POI XWPFDocument
    - Implement PDF extraction using Apache PDFBox
    - Implement XLSX extraction using Apache POI XSSFWorkbook
    - Add error handling and status tracking (PENDING, SUCCESS, FAILED)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [~] 9.4 Implement Document service layer with validation
    - Create DocumentService with upload and retrieval logic
    - Validate file format against allowed types (TXT, DOCX, PDF, XLSX)
    - Validate file size (max 50MB)
    - Store document metadata and extracted text
    - Handle extraction failures gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.6_
  
  - [~] 9.5 Write property test for document format validation
    - **Property 13: Document Format Validation**
    - **Validates: Requirements 6.1, 6.2**
    - Test that allowed formats are accepted and others are rejected
  
  - [~] 9.6 Write property test for document metadata preservation
    - **Property 14: Document Metadata Preservation**
    - **Validates: Requirements 6.5**
    - Test that filename, file size, and file type are preserved after upload
  
  - [~] 9.7 Implement Document REST controller
    - POST /api/documents/upload - Upload document (multipart/form-data)
    - GET /api/documents/{id} - Retrieve document metadata
    - GET /api/documents - List all documents
    - GET /api/documents/{id}/content - Retrieve extracted text
    - DELETE /api/documents/{id} - Delete document
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [~] 9.8 Write integration tests for document extraction
    - Test text extraction for each file format with sample files
    - Test error handling for corrupted files
    - Test file size validation

- [~] 10. Implement AI Service with forecasting and chatbot
  - [~] 10.1 Create FastAPI AI Service project structure
    - Set up Python project with FastAPI, PyTorch, TensorFlow, MySQL connector
    - Create main.py with FastAPI application
    - Configure to run on port 8000
    - Add CORS middleware for frontend access
    - _Requirements: 21.8_
  
  - [~] 10.2 Implement database connection and query utilities
    - Create MySQL connection pool
    - Implement query functions for business metrics, products, customers, sales
    - Implement document search function using fulltext search
    - _Requirements: 11.3, 12.1, 12.2, 12.3, 13.1_
  
  - [~] 10.3 Implement PyTorch LSTM sales forecasting model
    - Create SalesForecastModel class with 2-layer LSTM (64 units each)
    - Implement training function with 80/20 train/validation split
    - Implement data preprocessing and normalization
    - Implement forecast generation for 12 months
    - Save and load model weights
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [~] 10.4 Implement TensorFlow LSTM cost forecasting model
    - Create cost forecast model with 2-layer LSTM (64 units each)
    - Implement training function with 80/20 train/validation split
    - Implement data preprocessing and normalization
    - Implement forecast generation for 12 months
    - Save and load model weights
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [~] 10.5 Write property test for training data split ratio
    - **Property 19: Training Data Split Ratio**
    - **Validates: Requirements 15.5**
    - Test that 80/20 split produces correct training and validation set sizes
  
  - [~] 10.6 Implement profit forecasting calculation
    - Create function to calculate profit from sales and cost forecasts
    - Implement endpoint to return 12-month profit predictions
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [~] 10.7 Write property test for profit forecast calculation
    - **Property 16: Profit Forecast Calculation**
    - **Validates: Requirements 10.1**
    - Test that profit[month] = sales[month] - cost[month] for all months
  
  - [~] 10.8 Write property test for forecast response structure
    - **Property 15: Forecast Response Structure Completeness**
    - **Validates: Requirements 8.4, 9.4, 10.3**
    - Test that forecast responses contain exactly 12 predictions with month and value
  
  - [~] 10.9 Implement chatbot intent classification
    - Create intent classifier using keyword matching
    - Classify intents: sales_metrics, product_info, customer_info, document_search, mixed
    - _Requirements: 11.2_
  
  - [~] 10.10 Write property test for chatbot intent classification
    - **Property 17: Chatbot Intent Classification Consistency**
    - **Validates: Requirements 11.2**
    - Test that questions with domain keywords are classified to correct intent
  
  - [~] 10.11 Implement chatbot query processor
    - Create query processing function that routes to appropriate data source
    - Implement database query handlers for each intent
    - Implement document search handler with keyword extraction
    - Implement response formatting for natural language answers
    - _Requirements: 11.1, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.3, 13.4, 13.5, 13.6_
  
  - [~] 10.12 Write property test for document search result ranking
    - **Property 18: Document Search Result Ranking**
    - **Validates: Requirements 13.2**
    - Test that search results are ordered by relevance score (descending)
  
  - [~] 10.13 Implement AI Service REST endpoints
    - POST /api/ai/forecast/sales - Generate sales forecast
    - POST /api/ai/forecast/costs - Generate cost forecast
    - POST /api/ai/forecast/profit - Generate profit forecast
    - POST /api/ai/chatbot/query - Process chatbot question
    - POST /api/ai/train - Trigger model training (admin endpoint)
    - _Requirements: 8.2, 9.2, 10.2, 11.1, 15.2_
  
  - [~] 10.14 Write unit tests for AI Service endpoints
    - Test forecast generation with mocked models
    - Test chatbot query processing with mocked database
    - Test error handling for insufficient training data
    - Test model loading errors

- [~] 11. Create model training script
  - [~] 11.1 Create standalone Python training script
    - Load historical business metrics from database
    - Train PyTorch sales forecasting model
    - Train TensorFlow cost forecasting model
    - Evaluate models and print MAPE metrics
    - Save trained model files to disk
    - _Requirements: 15.1, 15.2, 15.3, 15.5, 15.6_

- [~] 12. Checkpoint - Ensure all backend services are working
  - Ensure all tests pass, ask the user if questions arise.

- [~] 13. Implement React TypeScript frontend application
  - [~] 13.1 Create React TypeScript project with Vite
    - Initialize project with Vite template
    - Install dependencies: react-router-dom, axios, recharts
    - Configure to run on port 5173
    - Set up project structure (components, pages, services)
    - _Requirements: 18.5_
  
  - [~] 13.2 Configure Axios HTTP client
    - Create axios instance with base URL http://localhost:8080
    - Add request/response interceptors for error handling
    - Create API service modules for each backend service
    - _Requirements: 19.1_
  
  - [~] 13.3 Implement routing and navigation
    - Set up React Router with routes: /, /forecasts, /documents, /chatbot, /products, /customers, /sales
    - Create navigation header component with links
    - Implement active link highlighting
    - _Requirements: 18.1, 18.2, 18.3, 18.4_
  
  - [~] 13.4 Implement Dashboard page component
    - Create Dashboard component with metrics display
    - Fetch and display total sales, costs, profit for selected period
    - Display best and worst performing months
    - Display top 5 products by revenue
    - Render line charts for sales, cost, profit trends using Recharts
    - Implement date range filtering
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [~] 13.5 Write unit tests for Dashboard component
    - Test metrics display with mocked data
    - Test chart rendering
    - Test date range filtering

  - [~] 13.6 Implement Forecast page component
    - Create Forecast component with three chart sections
    - Add buttons to trigger sales, cost, profit forecast generation
    - Display loading indicators during forecast generation
    - Render forecast charts with historical and predicted data
    - Distinguish historical vs predicted data visually
    - _Requirements: 8.5, 9.5, 10.4, 10.5_
  
  - [~] 13.7 Write unit tests for Forecast component
    - Test forecast generation triggers
    - Test chart rendering with mocked forecast data
    - Test loading states

  - [~] 13.8 Implement Document Upload page component
    - Create file input with format validation (TXT, DOCX, PDF, XLSX)
    - Implement upload progress indicator
    - Display document list with metadata (filename, size, type, upload date)
    - Display extraction status for each document
    - Handle and display upload errors
    - _Requirements: 6.6, 19.3_
  
  - [~] 13.9 Write unit tests for Document Upload component
    - Test file format validation
    - Test upload error handling
    - Test document list rendering

  - [~] 13.10 Implement Chatbot page component
    - Create text input for questions
    - Display conversation history with message bubbles
    - Distinguish user messages from bot responses visually
    - Show loading indicator during query processing
    - Handle and display query errors
    - _Requirements: 11.6, 19.4_
  
  - [~] 13.11 Write unit tests for Chatbot component
    - Test message sending
    - Test conversation history display
    - Test error handling

  - [~] 13.12 Implement Product Management page component
    - Create product form with fields: name, category, cost, price
    - Implement client-side validation
    - Display product list in table format
    - Add edit and delete actions for each product
    - _Requirements: 1.6, 19.2_
  
  - [~] 13.13 Write unit tests for Product Management component
    - Test form validation
    - Test CRUD operations with mocked API
    - Test error handling

  - [~] 13.14 Implement Customer Management page component
    - Create customer form with fields: name, email, segment, country
    - Implement client-side email validation
    - Display customer list in table format
    - Add edit and delete actions for each customer
    - _Requirements: 2.6, 19.2_
  
  - [~] 13.15 Write unit tests for Customer Management component
    - Test form validation including email format
    - Test CRUD operations with mocked API
    - Test error handling

  - [~] 13.16 Implement Sales Transaction page component
    - Create transaction form with customer select, product select, date, quantity
    - Fetch and populate customer and product dropdowns
    - Display transaction list with filters (date range, customer, product)
    - _Requirements: 3.6_
  
  - [~] 13.17 Write unit tests for Sales Transaction component
    - Test form submission
    - Test filtering functionality
    - Test error handling

  - [~] 13.18 Implement global error handling and user feedback
    - Create toast notification component for errors
    - Add error boundaries for component error handling
    - Display validation errors on forms
    - Show loading states for all async operations
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [~] 14. Checkpoint - Ensure frontend is working with all backend services
  - Ensure all tests pass, ask the user if questions arise.

- [~] 15. Integration and end-to-end testing
  - [~] 15.1 Write integration tests for microservices communication
    - Test API Gateway routing to each microservice
    - Test Sales Service calls to Product and Customer services
    - Test end-to-end transaction creation flow
  
  - [~] 15.2 Write integration tests for AI Service
    - Test model loading on service startup
    - Test forecast generation with real database data
    - Test chatbot queries with real database and documents
  
  - [~] 15.3 Write integration tests for document extraction
    - Test text extraction for each file format with sample files
    - Verify extracted text content accuracy
  
  - [~] 15.4 Write end-to-end tests for critical user workflows
    - Test complete product management workflow
    - Test complete sales transaction creation workflow
    - Test dashboard load and metric display
    - Test document upload and chatbot query workflow
    - Test forecast generation workflow

- [~] 16. Create comprehensive documentation
  - [~] 16.1 Create main README.md with setup instructions
    - Document required software: Java 17, Node.js 18+, Python 3.9+, MySQL 8.0
    - Document port numbers for all services
    - Provide step-by-step setup instructions for database
    - Provide step-by-step setup instructions for each microservice
    - Provide step-by-step setup instructions for AI service
    - Provide step-by-step setup instructions for frontend
    - Document how to run the data generation script
    - Document how to train AI models
    - Document how to start all services
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_
  
  - [~] 16.2 Create architecture documentation
    - Document microservices architecture with diagrams
    - Document API Gateway routing configuration
    - Document inter-service communication patterns
    - Document database schema and relationships
    - Store in .kiro/specs/business-ai-analytics/docs/architecture.md
  
  - [~] 16.3 Create API documentation
    - Document all REST endpoints for each microservice
    - Document request/response formats with examples
    - Document error responses and status codes
    - Store in .kiro/specs/business-ai-analytics/docs/api.md

- [~] 17. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all services start successfully
  - Verify end-to-end workflows function correctly
  - Verify documentation is complete and accurate

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate the 22 correctness properties defined in the design document
- The implementation follows a bottom-up approach to ensure dependencies are available when needed
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All microservices use Spring Boot 3.x with Java 17
- AI Service uses Python 3.9+ with FastAPI, PyTorch, and TensorFlow
- Frontend uses React 18 with TypeScript and Vite
- Database uses MySQL 8.0 with shared schema across microservices
