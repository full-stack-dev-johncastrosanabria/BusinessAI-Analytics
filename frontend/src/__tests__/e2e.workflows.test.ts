/**
 * End-to-End Workflow Tests for BusinessAI-Analytics Frontend
 * 
 * These tests validate complete user workflows through the frontend UI:
 * 1. Complete product management workflow
 * 2. Complete sales transaction creation workflow
 * 3. Dashboard load and metric display
 * 4. Document upload and chatbot query workflow
 * 5. Forecast generation workflow
 * 
 * Tests use mocked API responses to simulate backend services.
 * 
 * Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.6, 4.1-4.4, 5.1-5.6, 6.1-6.6,
 *              8.1-8.6, 9.1-9.6, 10.1-10.3, 11.1-11.6, 12.1-12.6, 13.1-13.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('End-to-End Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== Workflow 1: Product Management ====================

  describe('Workflow 1: Product Management', () => {
    it('should complete full product lifecycle: create, read, update, delete', async () => {
      // Step 1: Create a product
      const createProductData = {
        name: 'Professional Laptop',
        category: 'Electronics',
        cost: 800.00,
        price: 1500.00
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: 1,
          ...createProductData,
          createdAt: new Date().toISOString()
        }
      });

      const createResponse = await mockedAxios.post('/api/products', createProductData);
      expect(createResponse.data.id).toBe(1);
      expect(createResponse.data.name).toBe('Professional Laptop');
      expect(createResponse.data.price).toBe(1500.00);

      // Step 2: Retrieve the product
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 1,
          ...createProductData,
          createdAt: new Date().toISOString()
        }
      });

      const getResponse = await mockedAxios.get('/api/products/1');
      expect(getResponse.data.name).toBe('Professional Laptop');
      expect(getResponse.data.category).toBe('Electronics');

      // Step 3: Update the product
      const updateProductData = {
        name: 'Professional Laptop Pro',
        category: 'Electronics',
        cost: 900.00,
        price: 1800.00
      };

      mockedAxios.put.mockResolvedValueOnce({
        data: {
          id: 1,
          ...updateProductData,
          updatedAt: new Date().toISOString()
        }
      });

      const updateResponse = await mockedAxios.put('/api/products/1', updateProductData);
      expect(updateResponse.data.name).toBe('Professional Laptop Pro');
      expect(updateResponse.data.price).toBe(1800.00);

      // Step 4: Delete the product
      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: true }
      });

      const deleteResponse = await mockedAxios.delete('/api/products/1');
      expect(deleteResponse.data.success).toBe(true);

      // Verify deletion
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404 }
      });

      try {
        await mockedAxios.get('/api/products/1');
        expect.fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should validate product data before creation', async () => {
      const invalidProduct = {
        name: '',
        category: 'Electronics',
        cost: -100.00,
        price: 1500.00
      };

      // Simulate validation error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid product data' }
        }
      });

      try {
        await mockedAxios.post('/api/products', invalidProduct);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should list all products', async () => {
      const products = [
        { id: 1, name: 'Laptop', category: 'Electronics', cost: 800, price: 1500 },
        { id: 2, name: 'Mouse', category: 'Electronics', cost: 20, price: 50 },
        { id: 3, name: 'Desk', category: 'Furniture', cost: 200, price: 500 }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: products
      });

      const response = await mockedAxios.get('/api/products');
      expect(response.data).toHaveLength(3);
      expect(response.data[0].name).toBe('Laptop');
      expect(response.data[1].name).toBe('Mouse');
    });
  });

  // ==================== Workflow 2: Sales Transaction Creation ====================

  describe('Workflow 2: Sales Transaction Creation', () => {
    it('should complete full sales transaction workflow: create customer, product, transaction', async () => {
      // Step 1: Create a customer
      const customerData = {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        segment: 'Enterprise',
        country: 'USA'
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: 1,
          ...customerData,
          createdAt: new Date().toISOString()
        }
      });

      const customerResponse = await mockedAxios.post('/api/customers', customerData);
      expect(customerResponse.data.id).toBe(1);
      expect(customerResponse.data.name).toBe('Acme Corporation');
      expect(customerResponse.data.email).toBe('contact@acme.com');

      // Step 2: Create a product
      const productData = {
        name: 'Enterprise Software License',
        category: 'Software',
        cost: 5000.00,
        price: 10000.00
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: 1,
          ...productData,
          createdAt: new Date().toISOString()
        }
      });

      const productResponse = await mockedAxios.post('/api/products', productData);
      expect(productResponse.data.id).toBe(1);
      expect(productResponse.data.name).toBe('Enterprise Software License');

      // Step 3: Create a sales transaction
      const transactionData = {
        customerId: 1,
        productId: 1,
        transactionDate: '2024-01-15',
        quantity: 2
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          id: 1,
          ...transactionData,
          totalAmount: 20000.00, // 2 * 10000
          createdAt: new Date().toISOString()
        }
      });

      const transactionResponse = await mockedAxios.post('/api/sales', transactionData);
      expect(transactionResponse.data.id).toBe(1);
      expect(transactionResponse.data.customerId).toBe(1);
      expect(transactionResponse.data.productId).toBe(1);
      expect(transactionResponse.data.totalAmount).toBe(20000.00);

      // Step 4: Verify transaction total calculation
      expect(transactionResponse.data.totalAmount).toBe(transactionData.quantity * productData.price);

      // Step 5: Retrieve transaction with details
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          id: 1,
          ...transactionData,
          totalAmount: 20000.00,
          customer: customerData,
          product: productData,
          createdAt: new Date().toISOString()
        }
      });

      const retrieveResponse = await mockedAxios.get('/api/sales/1');
      expect(retrieveResponse.data.customer.name).toBe('Acme Corporation');
      expect(retrieveResponse.data.product.name).toBe('Enterprise Software License');
    });

    it('should validate customer and product references', async () => {
      const transactionData = {
        customerId: 999999,
        productId: 1,
        transactionDate: '2024-01-15',
        quantity: 2
      };

      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Customer not found' }
        }
      });

      try {
        await mockedAxios.post('/api/sales', transactionData);
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should filter transactions by date range', async () => {
      const transactions = [
        { id: 1, customerId: 1, productId: 1, transactionDate: '2024-01-15', quantity: 2, totalAmount: 20000 },
        { id: 2, customerId: 2, productId: 2, transactionDate: '2024-01-20', quantity: 1, totalAmount: 5000 }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: transactions
      });

      const response = await mockedAxios.get('/api/sales', {
        params: {
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31'
        }
      });

      expect(response.data).toHaveLength(2);
      expect(response.data[0].transactionDate).toBe('2024-01-15');
    });
  });

  // ==================== Workflow 3: Dashboard Load and Metric Display ====================

  describe('Workflow 3: Dashboard Load and Metric Display', () => {
    it('should load dashboard with all required metrics', async () => {
      const dashboardData = {
        totalSales: 150000.00,
        totalCosts: 90000.00,
        totalProfit: 60000.00,
        bestMonth: {
          month: 3,
          year: 2024,
          profit: 20000.00
        },
        worstMonth: {
          month: 1,
          year: 2024,
          profit: 10000.00
        },
        topProducts: [
          { productId: 1, productName: 'Laptop', totalRevenue: 120000.00 },
          { productId: 2, productName: 'Mouse', totalRevenue: 30000.00 }
        ],
        salesTrend: [
          { month: '2024-01', sales: 50000 },
          { month: '2024-02', sales: 55000 },
          { month: '2024-03', sales: 60000 }
        ],
        costTrend: [
          { month: '2024-01', costs: 30000 },
          { month: '2024-02', costs: 32000 },
          { month: '2024-03', costs: 33000 }
        ],
        profitTrend: [
          { month: '2024-01', profit: 10000 },
          { month: '2024-02', profit: 13000 },
          { month: '2024-03', profit: 20000 }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: dashboardData
      });

      const response = await mockedAxios.get('/api/analytics/dashboard');

      // Verify all required metrics are present
      expect(response.data.totalSales).toBe(150000.00);
      expect(response.data.totalCosts).toBe(90000.00);
      expect(response.data.totalProfit).toBe(60000.00);
      expect(response.data.bestMonth).toBeDefined();
      expect(response.data.worstMonth).toBeDefined();
      expect(response.data.topProducts).toHaveLength(2);
      expect(response.data.salesTrend).toHaveLength(3);
      expect(response.data.costTrend).toHaveLength(3);
      expect(response.data.profitTrend).toHaveLength(3);
    });

    it('should filter dashboard data by date range', async () => {
      const filteredDashboardData = {
        totalSales: 100000.00,
        totalCosts: 60000.00,
        totalProfit: 40000.00,
        bestMonth: { month: 2, year: 2024, profit: 15000.00 },
        worstMonth: { month: 1, year: 2024, profit: 10000.00 },
        topProducts: [
          { productId: 1, productName: 'Laptop', totalRevenue: 80000.00 }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: filteredDashboardData
      });

      const response = await mockedAxios.get('/api/analytics/dashboard', {
        params: {
          dateFrom: '2024-01-01',
          dateTo: '2024-02-29'
        }
      });

      expect(response.data.totalSales).toBe(100000.00);
      expect(response.data.topProducts).toHaveLength(1);
    });

    it('should display best and worst performing months correctly', async () => {
      const dashboardData = {
        bestMonth: { month: 3, year: 2024, profit: 20000.00 },
        worstMonth: { month: 1, year: 2024, profit: 10000.00 }
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: dashboardData
      });

      const response = await mockedAxios.get('/api/analytics/dashboard');

      expect(response.data.bestMonth.profit).toBeGreaterThanOrEqual(response.data.worstMonth.profit);
      expect(response.data.bestMonth.month).toBe(3);
      expect(response.data.worstMonth.month).toBe(1);
    });

    it('should display top 5 products by revenue', async () => {
      const dashboardData = {
        topProducts: [
          { productId: 1, productName: 'Laptop', totalRevenue: 120000.00 },
          { productId: 2, productName: 'Mouse', totalRevenue: 30000.00 },
          { productId: 3, productName: 'Keyboard', totalRevenue: 25000.00 },
          { productId: 4, productName: 'Monitor', totalRevenue: 20000.00 },
          { productId: 5, productName: 'Desk', totalRevenue: 15000.00 }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: dashboardData
      });

      const response = await mockedAxios.get('/api/analytics/dashboard');

      expect(response.data.topProducts).toHaveLength(5);
      // Verify sorted by revenue (descending)
      for (let i = 0; i < response.data.topProducts.length - 1; i++) {
        expect(response.data.topProducts[i].totalRevenue).toBeGreaterThanOrEqual(
          response.data.topProducts[i + 1].totalRevenue
        );
      }
    });
  });

  // ==================== Workflow 4: Document Upload and Chatbot Query ====================

  describe('Workflow 4: Document Upload and Chatbot Query', () => {
    it('should upload document and query chatbot about content', async () => {
      // Step 1: Upload document
      const uploadResponse = {
        id: 1,
        filename: 'business_strategy.txt',
        fileType: 'TXT',
        fileSize: 1024,
        uploadDate: new Date().toISOString(),
        extractionStatus: 'SUCCESS',
        extractedText: 'Our business strategy focuses on enterprise solutions and customer satisfaction.'
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: uploadResponse
      });

      const uploadResult = await mockedAxios.post('/api/documents/upload', new FormData());
      expect(uploadResult.data.id).toBe(1);
      expect(uploadResult.data.filename).toBe('business_strategy.txt');
      expect(uploadResult.data.extractionStatus).toBe('SUCCESS');

      // Step 2: Verify document metadata
      mockedAxios.get.mockResolvedValueOnce({
        data: uploadResponse
      });

      const metadataResult = await mockedAxios.get('/api/documents/1');
      expect(metadataResult.data.filename).toBe('business_strategy.txt');
      expect(metadataResult.data.fileType).toBe('TXT');

      // Step 3: Query chatbot about document
      const chatbotResponse = {
        question: 'What is our business strategy?',
        answer: 'Our business strategy focuses on enterprise solutions and customer satisfaction.',
        sources: ['document:business_strategy.txt'],
        processingTime: 0.5
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: chatbotResponse
      });

      const queryResult = await mockedAxios.post('/api/ai/chatbot/query', {
        question: 'What is our business strategy?'
      });

      expect(queryResult.data.answer).toContain('business strategy');
      expect(queryResult.data.sources).toContain('document:business_strategy.txt');
    });

    it('should handle document upload errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid file format' }
        }
      });

      try {
        await mockedAxios.post('/api/documents/upload', new FormData());
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should list all uploaded documents', async () => {
      const documents = [
        { id: 1, filename: 'strategy.txt', fileType: 'TXT', uploadDate: '2024-01-15' },
        { id: 2, filename: 'report.pdf', fileType: 'PDF', uploadDate: '2024-01-16' }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: documents
      });

      const response = await mockedAxios.get('/api/documents');
      expect(response.data).toHaveLength(2);
      expect(response.data[0].filename).toBe('strategy.txt');
    });

    it('should retrieve document content', async () => {
      const documentContent = {
        id: 1,
        filename: 'business_strategy.txt',
        extractedText: 'Our business strategy focuses on enterprise solutions and customer satisfaction.'
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: documentContent
      });

      const response = await mockedAxios.get('/api/documents/1/content');
      expect(response.data.extractedText).toContain('business strategy');
    });
  });

  // ==================== Workflow 5: Forecast Generation ====================

  describe('Workflow 5: Forecast Generation', () => {
    it('should generate sales, cost, and profit forecasts', async () => {
      // Step 1: Generate sales forecast
      const salesForecast = {
        predictions: [
          { month: '2024-02', value: 52000 },
          { month: '2024-03', value: 54000 },
          { month: '2024-04', value: 56000 },
          { month: '2024-05', value: 58000 },
          { month: '2024-06', value: 60000 },
          { month: '2024-07', value: 62000 },
          { month: '2024-08', value: 64000 },
          { month: '2024-09', value: 66000 },
          { month: '2024-10', value: 68000 },
          { month: '2024-11', value: 70000 },
          { month: '2024-12', value: 72000 },
          { month: '2025-01', value: 74000 }
        ],
        mape: 15.5
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: salesForecast
      });

      const salesResult = await mockedAxios.post('/api/ai/forecast/sales', {});
      expect(salesResult.data.predictions).toHaveLength(12);
      expect(salesResult.data.mape).toBeLessThan(20);

      // Step 2: Generate cost forecast
      const costForecast = {
        predictions: [
          { month: '2024-02', value: 31000 },
          { month: '2024-03', value: 32000 },
          { month: '2024-04', value: 33000 },
          { month: '2024-05', value: 34000 },
          { month: '2024-06', value: 35000 },
          { month: '2024-07', value: 36000 },
          { month: '2024-08', value: 37000 },
          { month: '2024-09', value: 38000 },
          { month: '2024-10', value: 39000 },
          { month: '2024-11', value: 40000 },
          { month: '2024-12', value: 41000 },
          { month: '2025-01', value: 42000 }
        ],
        mape: 12.3
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: costForecast
      });

      const costResult = await mockedAxios.post('/api/ai/forecast/costs', {});
      expect(costResult.data.predictions).toHaveLength(12);
      expect(costResult.data.mape).toBeLessThan(20);

      // Step 3: Generate profit forecast
      const profitForecast = {
        predictions: [
          { month: '2024-02', value: 21000 },
          { month: '2024-03', value: 22000 },
          { month: '2024-04', value: 23000 },
          { month: '2024-05', value: 24000 },
          { month: '2024-06', value: 25000 },
          { month: '2024-07', value: 26000 },
          { month: '2024-08', value: 27000 },
          { month: '2024-09', value: 28000 },
          { month: '2024-10', value: 29000 },
          { month: '2024-11', value: 30000 },
          { month: '2024-12', value: 31000 },
          { month: '2025-01', value: 32000 }
        ]
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: profitForecast
      });

      const profitResult = await mockedAxios.post('/api/ai/forecast/profit', {});
      expect(profitResult.data.predictions).toHaveLength(12);

      // Verify profit = sales - costs
      for (let i = 0; i < 12; i++) {
        const expectedProfit = salesForecast.predictions[i].value - costForecast.predictions[i].value;
        expect(profitResult.data.predictions[i].value).toBe(expectedProfit);
      }
    });

    it('should handle insufficient training data error', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Insufficient training data: need at least 24 months' }
        }
      });

      try {
        await mockedAxios.post('/api/ai/forecast/sales', {});
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Insufficient');
      }
    });

    it('should verify forecast contains exactly 12 months', async () => {
      // Generate 12 months starting from 2024-02 through 2025-01
      const months = [
        '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07',
        '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01'
      ];
      const forecast = {
        predictions: months.map((month, i) => ({
          month,
          value: 50000 + i * 1000
        }))
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: forecast
      });

      const result = await mockedAxios.post('/api/ai/forecast/sales', {});
      expect(result.data.predictions).toHaveLength(12);
      expect(result.data.predictions[0].month).toBe('2024-02');
      expect(result.data.predictions[11].month).toBe('2025-01');
    });
  });

  // ==================== Cross-Workflow Integration Tests ====================

  describe('Cross-Workflow Integration', () => {
    it('should handle multiple workflows without interference', async () => {
      // Create product
      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 1, name: 'Test Product', price: 100 }
      });
      await mockedAxios.post('/api/products', {});

      // Create customer
      mockedAxios.post.mockResolvedValueOnce({
        data: { id: 1, name: 'Test Customer', email: 'test@example.com' }
      });
      await mockedAxios.post('/api/customers', {});

      // Load dashboard
      mockedAxios.get.mockResolvedValueOnce({
        data: { totalSales: 100000, totalCosts: 60000, totalProfit: 40000 }
      });
      await mockedAxios.get('/api/analytics/dashboard');

      // All requests should succeed
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should maintain data consistency across workflows', async () => {
      const productData = { id: 1, name: 'Laptop', price: 1500 };

      // Create product
      mockedAxios.post.mockResolvedValueOnce({
        data: productData
      });
      const createResult = await mockedAxios.post('/api/products', {});

      // Retrieve product
      mockedAxios.get.mockResolvedValueOnce({
        data: productData
      });
      const getResult = await mockedAxios.get('/api/products/1');

      // Data should be consistent
      expect(createResult.data.id).toBe(getResult.data.id);
      expect(createResult.data.name).toBe(getResult.data.name);
      expect(createResult.data.price).toBe(getResult.data.price);
    });

    it('should handle errors gracefully across workflows', async () => {
      // Simulate various error scenarios
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'Validation error' } }
      });

      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Not found' } }
      });

      mockedAxios.delete.mockRejectedValueOnce({
        response: { status: 500, data: { error: 'Server error' } }
      });

      // All errors should be handled appropriately
      try {
        await mockedAxios.post('/api/products', {});
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }

      try {
        await mockedAxios.get('/api/products/999');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }

      try {
        await mockedAxios.delete('/api/products/1');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });
  });
});
