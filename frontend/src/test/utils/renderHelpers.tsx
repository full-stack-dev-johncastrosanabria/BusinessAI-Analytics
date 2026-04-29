/**
 * Shared render helpers for tests
 * Reduces duplication of provider setup across test files
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  includeRouter?: boolean;
  includeAuth?: boolean;
  includeTheme?: boolean;
  includeI18n?: boolean;
}

export const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export const createWrapper = (options: CustomRenderOptions = {}) => {
  const {
    queryClient = createQueryClient(),
    includeRouter = true,
    includeAuth = true,
    includeTheme = true,
    includeI18n = true,
  } = options;

  return ({ children }: { children: React.ReactNode }) => {
    let wrapped = children;

    if (includeI18n) {
      wrapped = <I18nextProvider i18n={i18n}>{wrapped}</I18nextProvider>;
    }

    if (includeTheme) {
      wrapped = <ThemeProvider>{wrapped}</ThemeProvider>;
    }

    if (includeAuth) {
      wrapped = <AuthProvider>{wrapped}</AuthProvider>;
    }

    if (includeRouter) {
      wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
    }

    return (
      <QueryClientProvider client={queryClient}>
        {wrapped}
      </QueryClientProvider>
    );
  };
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  return render(ui, { wrapper: createWrapper(options), ...options });
};

export const renderWithQueryClient = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  return render(ui, { 
    wrapper: createWrapper({ 
      includeRouter: false, 
      includeAuth: false, 
      includeTheme: false,
      ...options 
    }), 
    ...options 
  });
};