/**
 * Shared mock data factories for tests
 * Reduces duplication of mock objects across test files
 */

export const createMockProducts = () => [
  { id: 1, name: 'Laptop', category: 'Electronics', cost: 800, price: 1200 },
  { id: 2, name: 'Mouse', category: 'Accessories', cost: 10, price: 25 },
];

export const createMockCustomers = () => [
  { id: 1, name: 'Alice Smith', email: 'alice@example.com', segment: 'Premium', country: 'USA' },
  { id: 2, name: 'Bob Jones', email: 'bob@example.com', segment: 'Standard', country: 'UK' },
];

export const createMockTransactions = () => [
  {
    id: 1,
    customerId: 1,
    productId: 1,
    transactionDate: '2024-01-15',
    quantity: 2,
    totalAmount: 2400,
  },
  {
    id: 2,
    customerId: 2,
    productId: 2,
    transactionDate: '2024-01-16',
    quantity: 5,
    totalAmount: 125,
  },
];

export const createMockSummary = () => ({
  totalSales: 100000,
  totalCosts: 60000,
  totalProfit: 40000,
  bestMonth: { month: 6, year: 2024, profit: 8000 },
  worstMonth: { month: 1, year: 2024, profit: 1000 },
  topProducts: [
    { id: 1, name: 'Laptop', category: 'Electronics', totalRevenue: 50000 },
    { id: 2, name: 'Mouse', category: 'Accessories', totalRevenue: 10000 },
  ],
});

export const createMockMetrics = () => [
  { id: 1, month: 1, year: 2024, totalSales: 10000, totalCosts: 6000, totalExpenses: 1000, profit: 3000 },
  { id: 2, month: 2, year: 2024, totalSales: 12000, totalCosts: 7000, totalExpenses: 1000, profit: 4000 },
];