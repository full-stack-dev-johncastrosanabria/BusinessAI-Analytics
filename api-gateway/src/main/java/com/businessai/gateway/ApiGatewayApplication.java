package com.businessai.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the BusinessAI API Gateway.
 * 
 * This gateway serves as the single entry point for all client requests,
 * routing them to the appropriate microservices:
 * - Product Service (port 8081)
 * - Customer Service (port 8082)
 * - Sales Service (port 8083)
 * - Analytics Service (port 8084)
 * - Document Service (port 8085)
 * - AI Service (port 8000)
 * 
 * The gateway runs on port 8080 and provides:
 * - Request routing based on path predicates
 * - CORS configuration for frontend access
 * - Centralized logging and error handling
 * - Load balancing capabilities
 * 
 * Requirements: 21.3, 21.6
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
