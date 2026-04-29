/**
 * Unit Tests: ThemeContext and ThemeToggle
 *
 * Validates: Requirements 3.9
 * - Dark mode support with user preference persistence
 * - Theme switching functionality
 * - Proper data-theme attribute application
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Simple consumer component to read theme value
const ThemeConsumer: React.FC = () => {
  const { theme } = useTheme();
  return <div data-testid="theme-value">{theme}</div>;
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light theme when no preference is saved', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('restores saved dark theme from localStorage', () => {
    localStorageMock.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('restores saved light theme from localStorage', () => {
    localStorageMock.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('ignores invalid saved theme values and defaults to light', () => {
    localStorageMock.setItem('theme', 'invalid-value');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('sets data-theme attribute on documentElement when theme changes', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets data-theme="dark" when dark theme is active', () => {
    localStorageMock.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('adds "dark" class to documentElement in dark mode', () => {
    localStorageMock.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes "dark" class from documentElement in light mode', () => {
    document.documentElement.classList.add('dark');
    localStorageMock.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists theme to localStorage when toggled', () => {
    const ToggleConsumer: React.FC = () => {
      const { toggleTheme } = useTheme();
      return <button onClick={toggleTheme}>toggle</button>;
    };

    render(
      <ThemeProvider>
        <ToggleConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('toggle'));
    expect(localStorageMock.getItem('theme')).toBe('dark');
  });

  it('toggles from dark back to light and persists', () => {
    localStorageMock.setItem('theme', 'dark');
    const ToggleConsumer: React.FC = () => {
      const { toggleTheme } = useTheme();
      return <button onClick={toggleTheme}>toggle</button>;
    };

    render(
      <ThemeProvider>
        <ToggleConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('toggle'));
    expect(localStorageMock.getItem('theme')).toBe('light');
  });

  it('throws when useTheme is used outside ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    consoleError.mockRestore();
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  it('renders a button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('has an accessible aria-label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });
});
