/**
 * Shared test helper utilities
 * Reduces duplication of common test setup and assertion patterns
 */

import { vi, beforeEach, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { setupLocalStorageMock } from './mockStorage';

export const setupTestEnvironment = () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });
};

export const setupTestEnvironmentWithStorage = () => {
  const localStorageMock = setupLocalStorageMock();
  
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });
  
  return localStorageMock;
};

export const expectTableHeaders = (expectedHeaders: string[]) => {
  const headers = document.querySelectorAll('th');
  const headerTexts = Array.from(headers).map(h => h.textContent);
  expectedHeaders.forEach(header => {
    expect(headerTexts).toContain(header);
  });
};

export const expectLoadingState = (loadingText = /Loading/i) => {
  expect(screen.getByText(loadingText)).toBeInTheDocument();
};