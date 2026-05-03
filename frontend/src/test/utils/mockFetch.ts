/**
 * Shared fetch mocking utilities for tests
 * Reduces duplication of fetch mock setup across test files
 */

import { vi } from 'vitest';
import { createMockSummary, createMockMetrics } from './mockData';

export const createFetchMock = () => vi.fn();

export const mockFetchSuccess = (customData?: Record<string, unknown>) => {
  const mockSummary = createMockSummary();
  const mockMetrics = createMockMetrics();
  
  vi.mocked(globalThis.fetch).mockImplementation((url: RequestInfo | URL) => {
    const urlStr = url.toString();
    let data: unknown = {};
    
    if (urlStr.includes('/api/analytics/dashboard')) {
      data = customData?.summary || mockSummary;
    } else if (urlStr.includes('/api/analytics/metrics')) {
      data = customData?.metrics || mockMetrics;
    } else if (customData && urlStr in customData) {
      data = customData[urlStr];
    }
    
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
};

export const mockFetchError = (errorMessage = 'Failed to load data') => {
  vi.mocked(globalThis.fetch).mockRejectedValue(new Error(errorMessage));
};

export const mockFetchPending = () => {
  vi.mocked(globalThis.fetch).mockReturnValue(new Promise(() => {}));
};