# Requirements Document

## Introduction

BusinessAI-Analytics is a local business intelligence platform that enables companies to manage business data, visualize analytics through dashboards, forecast future performance using AI models, and interact with a chatbot that answers questions using both database records and uploaded business documents. The system consists of a microservices-based Java Spring Boot backend, Python FastAPI AI service, React frontend, and MySQL database, all running locally without containerization. The backend is decomposed into multiple microservices for better separation of concerns and scalability.

## Glossary

- **Product_Service**: The Java 17 Spring Boot microservice running on port 8081 managing product data
- **Customer_Service**: The Java 17 Spring Boot microservice running on port 8082 managing customer data
- **Sales_Service**: The Java 17 Spring Boot microservice running on port 8083 managing sales transactions
- **Analytics_Service**: The Java 17 Spring Boot microservice running on port 8084 managing business metrics and dashboard data
- **Document_Service**: The Java 17 Spring Boot microservice running on port 8085 managing document uploads and text extraction
- **API_Gateway**: The Java 17 Spring Boot gateway service running on port 8080 that routes requests to microservices
- **AI_Service**: The Python FastAPI service running on port 8000 that provides forecasting and chatbot capabilities
- **Frontend_Application**: The React TypeScript application running on port 5173
- **Database**: The local MySQL database instance storing all business data
- **Product**: A business item with name, category, cost, and price attributes
- **Customer**: A business client with name, email, segment, and country attributes
- **Sales_Transaction**: A record of a product sale to a customer with date and quantity
- **Business_Metric**: Monthly aggregated data including sales, costs, expenses, and profit
- **Document**: An uploaded file in TXT, DOCX, PDF, or XLSX format used as knowledge source
- **Chatbot**: The conversational interface that answers business questions using database and document data
- **Forecast**: A prediction of future sales, costs, or profit values for the next 12 months
- **Dashboard**: The visual interface displaying business metrics, charts, and summaries

## Requirements

### Requirement 1: Product Management

**User Story:** As a business manager, I want to manage product information, so that I can track inventory and pricing data.

#### Acceptance Criteria

1. THE Product_Service SHALL store Product records with name, category, cost, and price fields
2. WHEN a create Product request is received, THE Product_Service SHALL validate all required fields and persist the Product to the Database
3. WHEN a retrieve Product request is received, THE Product_Service SHALL return the Product data from the Database
4. WHEN an update Product request is received, THE Product_Service SHALL modify the existing Product in the Database
5. WHEN a delete Product request is received, THE Product_Service SHALL remove the Product from the Database
6. THE Frontend_Application SHALL provide a user interface for creating, viewing, updating, and deleting Products

### Requirement 2: Customer Management

**User Story:** As a business manager, I want to manage customer information, so that I can track client relationships and segments.

#### Acceptance Criteria

1. THE Customer_Service SHALL store Customer records with name, email, segment, and country fields
2. WHEN a create Customer request is received, THE Customer_Service SHALL validate the email format and persist the Customer to the Database
3. WHEN a retrieve Customer request is received, THE Customer_Service SHALL return the Customer data from the Database
4. WHEN an update Customer request is received, THE Customer_Service SHALL modify the existing Customer in the Database
5. WHEN a delete Customer request is received, THE Customer_Service SHALL remove the Customer from the Database
6. THE Frontend_Application SHALL provide a user interface for creating, viewing, updating, and deleting Customers

### Requirement 3: Sales Transaction Recording

**User Story:** As a business manager, I want to record sales transactions, so that I can track revenue and customer purchases.

#### Acceptance Criteria

1. THE Sales_Service SHALL store Sales_Transaction records with customer reference, product reference, date, quantity, and total amount fields
2. WHEN a create Sales_Transaction request is received, THE Sales_Service SHALL validate that the referenced Customer and Product exist in the Database
3. WHEN a create Sales_Transaction request is received, THE Sales_Service SHALL calculate the total amount as quantity multiplied by product price
4. WHEN a retrieve Sales_Transaction request is received, THE Sales_Service SHALL return the Sales_Transaction data with Customer and Product details
5. THE Sales_Service SHALL support filtering Sales_Transaction records by date range, customer, and product
6. THE Frontend_Application SHALL provide a user interface for creating and viewing Sales_Transaction records

### Requirement 4: Business Metrics Tracking

**User Story:** As a business manager, I want to track monthly business metrics, so that I can monitor financial performance over time.

#### Acceptance Criteria

1. THE Analytics_Service SHALL store Business_Metric records with month, year, total sales, total costs, total expenses, and profit fields
2. WHEN a create Business_Metric request is received, THE Analytics_Service SHALL calculate profit as total sales minus total costs minus total expenses
3. WHEN a retrieve Business_Metric request is received for a date range, THE Analytics_Service SHALL return all Business_Metric records within that range
4. THE Analytics_Service SHALL support aggregating Sales_Transaction data to generate Business_Metric summaries
5. THE Frontend_Application SHALL display Business_Metric data in tabular and chart formats

### Requirement 5: Dashboard Visualization

**User Story:** As a business manager, I want to view a dashboard with key metrics and charts, so that I can quickly understand business performance.

#### Acceptance Criteria

1. THE Frontend_Application SHALL display total sales, total costs, and total profit metrics for a selected time period
2. THE Frontend_Application SHALL display the best performing month by profit and the worst performing month by profit
3. THE Frontend_Application SHALL display the top five Products ranked by total revenue
4. THE Frontend_Application SHALL display line charts showing sales trends, cost trends, and profit trends over time
5. WHEN the Dashboard is loaded, THE Frontend_Application SHALL fetch current metrics from the Analytics_Service within 2 seconds
6. THE Frontend_Application SHALL allow users to filter Dashboard data by date range

### Requirement 6: Document Upload and Storage

**User Story:** As a business manager, I want to upload business documents, so that the chatbot can use them to answer questions.

#### Acceptance Criteria

1. THE Document_Service SHALL accept Document uploads in TXT, DOCX, PDF, and XLSX formats
2. WHEN a Document upload request is received, THE Document_Service SHALL validate the file format against the allowed types
3. WHEN a valid Document is uploaded, THE Document_Service SHALL extract text content from the Document
4. WHEN text extraction succeeds, THE Document_Service SHALL store the Document metadata and extracted text in the Database
5. THE Document_Service SHALL store the original filename, upload date, file size, and file type for each Document
6. THE Frontend_Application SHALL provide a user interface for uploading Documents and viewing uploaded Document lists

### Requirement 7: Document Text Extraction

**User Story:** As a system administrator, I want documents to have their text extracted automatically, so that the content is searchable and usable by the chatbot.

#### Acceptance Criteria

1. WHEN a TXT Document is uploaded, THE Document_Service SHALL read the text content directly
2. WHEN a DOCX Document is uploaded, THE Document_Service SHALL extract text from all paragraphs and tables
3. WHEN a PDF Document is uploaded, THE Document_Service SHALL extract text from all pages
4. WHEN an XLSX Document is uploaded, THE Document_Service SHALL extract text from all cells across all sheets
5. IF text extraction fails for a Document, THEN THE Document_Service SHALL store an error message and mark the Document as failed
6. THE Document_Service SHALL store extracted text with a maximum length of 1000000 characters per Document

### Requirement 8: Sales Forecasting with PyTorch

**User Story:** As a business manager, I want to forecast future sales, so that I can plan inventory and resources.

#### Acceptance Criteria

1. THE AI_Service SHALL train a sales forecasting model using PyTorch based on historical Business_Metric data
2. WHEN a sales forecast request is received, THE AI_Service SHALL generate predictions for the next 12 months
3. THE AI_Service SHALL use at least 24 months of historical data to train the sales forecasting model
4. FOR ALL forecast requests, THE AI_Service SHALL return monthly sales predictions with month and predicted value pairs
5. THE Frontend_Application SHALL display the sales forecast as a line chart with historical and predicted values
6. WHEN the forecast model is trained, THE AI_Service SHALL achieve a mean absolute percentage error below 20 percent on validation data

### Requirement 9: Cost Forecasting with TensorFlow

**User Story:** As a business manager, I want to forecast future costs, so that I can budget effectively.

#### Acceptance Criteria

1. THE AI_Service SHALL train a cost forecasting model using TensorFlow based on historical Business_Metric data
2. WHEN a cost forecast request is received, THE AI_Service SHALL generate predictions for the next 12 months
3. THE AI_Service SHALL use at least 24 months of historical data to train the cost forecasting model
4. FOR ALL forecast requests, THE AI_Service SHALL return monthly cost predictions with month and predicted value pairs
5. THE Frontend_Application SHALL display the cost forecast as a line chart with historical and predicted values
6. WHEN the forecast model is trained, THE AI_Service SHALL achieve a mean absolute percentage error below 20 percent on validation data

### Requirement 10: Profit Forecasting

**User Story:** As a business manager, I want to forecast future profit, so that I can assess business viability.

#### Acceptance Criteria

1. THE AI_Service SHALL calculate profit forecasts by subtracting cost forecasts from sales forecasts
2. WHEN a profit forecast request is received, THE AI_Service SHALL generate predictions for the next 12 months
3. FOR ALL profit forecast requests, THE AI_Service SHALL return monthly profit predictions with month and predicted value pairs
4. THE Frontend_Application SHALL display the profit forecast as a line chart with historical and predicted values
5. THE Frontend_Application SHALL display all three forecasts on a single page for comparison

### Requirement 11: Business Chatbot Query Processing

**User Story:** As a business manager, I want to ask questions to a chatbot, so that I can get quick answers about business data.

#### Acceptance Criteria

1. THE AI_Service SHALL accept natural language questions from the Frontend_Application via the API_Gateway
2. WHEN a chatbot question is received, THE AI_Service SHALL determine whether the question requires database data, document data, or both
3. WHEN database data is needed, THE AI_Service SHALL query the Database directly to retrieve relevant information
4. WHEN document data is needed, THE AI_Service SHALL search Document text content for relevant information
5. THE AI_Service SHALL generate a natural language response based on the retrieved data within 5 seconds
6. THE Frontend_Application SHALL display the chatbot conversation history with user questions and chatbot responses

### Requirement 12: Chatbot Database Query Capability

**User Story:** As a business manager, I want the chatbot to answer questions using database records, so that I can get accurate business insights.

#### Acceptance Criteria

1. WHEN a question about sales metrics is asked, THE AI_Service SHALL retrieve Sales_Transaction and Business_Metric data from the Database
2. WHEN a question about products is asked, THE AI_Service SHALL retrieve Product data from the Database
3. WHEN a question about customers is asked, THE AI_Service SHALL retrieve Customer data from the Database
4. WHEN a question about best or worst performing periods is asked, THE AI_Service SHALL aggregate Business_Metric data and identify extremes
5. THE AI_Service SHALL format database query results into natural language responses
6. FOR ALL database queries, THE AI_Service SHALL return responses within 3 seconds

### Requirement 13: Chatbot Document Search Capability

**User Story:** As a business manager, I want the chatbot to answer questions using uploaded documents, so that I can find information in business files.

#### Acceptance Criteria

1. WHEN a question references document content, THE AI_Service SHALL search Document text for relevant keywords
2. THE AI_Service SHALL rank Document search results by relevance to the question
3. WHEN relevant Document content is found, THE AI_Service SHALL include Document excerpts in the response
4. WHEN relevant Document content is found, THE AI_Service SHALL include the source Document filename in the response
5. THE AI_Service SHALL support searching across all uploaded Documents simultaneously
6. IF no relevant Document content is found, THEN THE AI_Service SHALL inform the user that no matching documents exist

### Requirement 14: Synthetic Data Generation

**User Story:** As a system administrator, I want to generate realistic synthetic business data, so that the system can be demonstrated and tested.

#### Acceptance Criteria

1. THE Database SHALL be populated with at least 30 Product records across multiple categories
2. THE Database SHALL be populated with at least 100 Customer records across multiple segments and countries
3. THE Database SHALL be populated with at least 5000 Sales_Transaction records spanning 5 years
4. THE Database SHALL be populated with 60 Business_Metric records representing 5 years of monthly data
5. THE synthetic data SHALL exhibit realistic trends including seasonality and growth patterns
6. THE synthetic data SHALL include both profitable and unprofitable months to demonstrate variability

### Requirement 15: AI Model Training

**User Story:** As a system administrator, I want to train AI forecasting models on historical data, so that predictions are accurate.

#### Acceptance Criteria

1. THE AI_Service SHALL provide a training script that loads historical Business_Metric data from the Database
2. WHEN the training script is executed, THE AI_Service SHALL train both PyTorch and TensorFlow models
3. WHEN training completes, THE AI_Service SHALL save trained model files to the local filesystem
4. WHEN the AI_Service starts, THE AI_Service SHALL load pre-trained model files if they exist
5. THE training script SHALL split data into training and validation sets with an 80-20 ratio
6. THE training script SHALL output training loss and validation metrics to the console

### Requirement 16: Database Schema Management

**User Story:** As a system administrator, I want a database schema that supports all business entities, so that data is properly structured.

#### Acceptance Criteria

1. THE Database SHALL include tables for Products, Customers, Sales_Transactions, Business_Metrics, and Documents
2. THE Database SHALL enforce foreign key constraints between Sales_Transactions and Products
3. THE Database SHALL enforce foreign key constraints between Sales_Transactions and Customers
4. THE Database SHALL use appropriate data types for all fields including dates, decimals, and text
5. THE Database SHALL include indexes on frequently queried fields including dates and foreign keys
6. THE Database schema creation script SHALL be idempotent and safe to run multiple times

### Requirement 17: Backend API Endpoints

**User Story:** As a frontend developer, I want well-defined REST API endpoints, so that I can integrate the frontend with the backend.

#### Acceptance Criteria

1. THE API_Gateway SHALL expose REST endpoints for all CRUD operations on Products, Customers, Sales_Transactions, and Business_Metrics
2. THE API_Gateway SHALL route Product requests to the Product_Service
3. THE API_Gateway SHALL route Customer requests to the Customer_Service
4. THE API_Gateway SHALL route Sales requests to the Sales_Service
5. THE API_Gateway SHALL route Analytics and Dashboard requests to the Analytics_Service
6. THE API_Gateway SHALL route Document requests to the Document_Service
7. THE API_Gateway SHALL route AI requests to the AI_Service
8. THE API_Gateway SHALL return appropriate HTTP status codes including 200 for success, 400 for validation errors, 404 for not found, and 500 for server errors

### Requirement 18: Frontend Routing and Navigation

**User Story:** As a business manager, I want to navigate between different sections of the application, so that I can access all features.

#### Acceptance Criteria

1. THE Frontend_Application SHALL provide navigation to Dashboard, Forecasts, Documents, and Chatbot pages
2. WHEN a navigation link is clicked, THE Frontend_Application SHALL render the corresponding page without full page reload
3. THE Frontend_Application SHALL highlight the active page in the navigation menu
4. THE Frontend_Application SHALL display a professional header with the application name and navigation links
5. THE Frontend_Application SHALL use a consistent layout across all pages

### Requirement 19: Error Handling and User Feedback

**User Story:** As a business manager, I want to see clear error messages when something goes wrong, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN an API_Gateway request fails, THE Frontend_Application SHALL display an error message to the user
2. WHEN a form validation fails, THE Frontend_Application SHALL highlight invalid fields and display validation messages
3. WHEN a Document upload fails, THE Frontend_Application SHALL display the failure reason to the user
4. WHEN a chatbot request fails, THE Frontend_Application SHALL display an error message in the chat interface
5. ALL microservices SHALL log all errors with timestamps and stack traces to the console
6. THE AI_Service SHALL log all errors with timestamps and stack traces to the console

### Requirement 20: System Configuration and Setup

**User Story:** As a system administrator, I want clear setup instructions, so that I can run the application locally.

#### Acceptance Criteria

1. THE project SHALL include a README file with step-by-step setup instructions for all microservices and the AI service
2. THE README SHALL document all required software including Java 17, Node.js, Python, and MySQL
3. THE README SHALL document the database connection configuration for all microservices
4. THE README SHALL document the port numbers for the API Gateway (8080), all microservices (8081-8085), AI service (8000), and frontend (5173)
5. THE README SHALL include instructions for running the database schema script and seed data script
6. THE README SHALL include instructions for training the AI models before starting the AI_Service

### Requirement 21: Microservices Architecture

**User Story:** As a system architect, I want the backend decomposed into microservices, so that the system is modular, scalable, and maintainable.

#### Acceptance Criteria

1. THE backend SHALL be decomposed into five independent Spring Boot microservices: Product_Service, Customer_Service, Sales_Service, Analytics_Service, and Document_Service
2. EACH microservice SHALL run on its own port: Product_Service (8081), Customer_Service (8082), Sales_Service (8083), Analytics_Service (8084), Document_Service (8085)
3. THE API_Gateway SHALL run on port 8080 and route all frontend requests to the appropriate microservice
4. EACH microservice SHALL have its own package structure, entities, repositories, services, and controllers
5. EACH microservice SHALL connect to the same MySQL database but manage its own domain tables
6. THE API_Gateway SHALL implement request routing, load balancing, and error handling for all microservices
7. EACH microservice SHALL be independently deployable and runnable
8. THE microservices SHALL communicate synchronously via REST APIs when cross-service data is needed

## Notes

This requirements document defines a complete full-stack business intelligence platform with microservices architecture, data management, visualization, AI forecasting, and conversational interfaces. The backend is decomposed into five independent Spring Boot microservices (Product, Customer, Sales, Analytics, Document) coordinated by an API Gateway, providing better separation of concerns, independent scalability, and maintainability. The system is designed to run entirely locally without containerization, making it accessible for development and demonstration purposes. The synthetic data generation ensures the system can be tested and demonstrated immediately after setup.

The chatbot implementation uses a rule-based approach that combines database queries and document search, avoiding the need for paid external LLM APIs while still providing valuable question-answering capabilities. The AI forecasting models use established deep learning frameworks (PyTorch and TensorFlow) to demonstrate practical machine learning integration.

All requirements follow EARS patterns and INCOSE quality rules to ensure clarity, testability, and completeness.

DO NOT CREATE MD files all around the solution. Have single README.md file per project and add documentation seperatated by concerns in folders inside the .kiro folder.
