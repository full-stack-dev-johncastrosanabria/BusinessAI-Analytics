/**
 * Property-Based Tests: Dark Mode Functionality
 *
 * Property 21: Dark Mode Functionality Completeness
 * Validates: Requirements 3.9
 *
 * For any UI state or component, dark mode SHALL function correctly with
 * proper theming and user preference persistence across sessions.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { setupTestEnvironmentWithStorage } from '../../test/utils';

// ─── Helper components ────────────────────────────────────────────────────────

const ThemeConsumer: React.FC = () => {
  const { theme } = useTheme();
  return <div data-testid="theme-value">{theme}</div>;
};

const ToggleConsumer: React.FC = () => {
  const { toggleTheme } = useTheme();
  return <button data-testid="toggle" onClick={toggleTheme}>toggle</button>;
};

// ─── Helper functions ─────────────────────────────────────────────────────────

const resetThemeState = (localStorageMock: ReturnType<typeof setupTestEnvironmentWithStorage>) => {
  localStorageMock.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
};

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('Property 21: Dark Mode Functionality Completeness', () => {
  const localStorageMock = setupTestEnvironmentWithStorage();

  /**
   * Property 21.1: For any sequence of theme toggles, the final theme state
   * is always either 'light' or 'dark' (never undefined/null/invalid).
   *
   * Validates: Requirements 3.9
   */
  it('Property 21.1: theme state is always "light" or "dark" after any toggle sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (toggleCount) => {
          resetThemeState(localStorageMock);

          const { getByTestId, unmount } = render(
            <ThemeProvider>
              <ThemeConsumer />
              <ToggleConsumer />
            </ThemeProvider>
          );

          for (let i = 0; i < toggleCount; i++) {
            act(() => { fireEvent.click(getByTestId('toggle')); });
          }

          const themeValue = getByTestId('theme-value').textContent;
          unmount();

          return themeValue === 'light' || themeValue === 'dark';
        }
      )
    );
  });

  /**
   * Property 21.2: For any number of toggles, the DOM `data-theme` attribute
   * always matches the current theme state.
   *
   * Validates: Requirements 3.9
   */
  it('Property 21.2: data-theme attribute always matches current theme state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (toggleCount) => {
          resetThemeState(localStorageMock);

          const { getByTestId, unmount } = render(
            <ThemeProvider>
              <ThemeConsumer />
              <ToggleConsumer />
            </ThemeProvider>
          );

          for (let i = 0; i < toggleCount; i++) {
            act(() => { fireEvent.click(getByTestId('toggle')); });
          }

          const themeValue = getByTestId('theme-value').textContent;
          const dataTheme = document.documentElement.getAttribute('data-theme');
          unmount();

          return themeValue === dataTheme;
        }
      )
    );
  });

  /**
   * Property 21.3: For any number of toggles, the `dark` CSS class on
   * documentElement is present if and only if theme === 'dark'.
   *
   * Validates: Requirements 3.9
   */
  it('Property 21.3: dark CSS class is present iff theme === "dark"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (toggleCount) => {
          resetThemeState(localStorageMock);

          const { getByTestId, unmount } = render(
            <ThemeProvider>
              <ThemeConsumer />
              <ToggleConsumer />
            </ThemeProvider>
          );

          for (let i = 0; i < toggleCount; i++) {
            act(() => { fireEvent.click(getByTestId('toggle')); });
          }

          const themeValue = getByTestId('theme-value').textContent;
          const hasDarkClass = document.documentElement.classList.contains('dark');
          unmount();

          return (themeValue === 'dark') === hasDarkClass;
        }
      )
    );
  });

  /**
   * Property 21.4: For any saved localStorage value, the theme initializes
   * to 'light' or 'dark' (invalid values default to 'light').
   *
   * Validates: Requirements 3.9
   */
  it('Property 21.4: theme always initializes to "light" or "dark" regardless of stored value', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('light'),
          fc.constant('dark'),
          fc.constant(''),
          fc.constant(null),
          fc.string({ minLength: 0, maxLength: 20 })
        ),
        (storedValue) => {
          resetThemeState(localStorageMock);

          if (storedValue !== null) {
            localStorageMock.setItem('theme', storedValue);
          }

          const { getByTestId, unmount } = render(
            <ThemeProvider>
              <ThemeConsumer />
            </ThemeProvider>
          );

          const themeValue = getByTestId('theme-value').textContent;
          unmount();

          return themeValue === 'light' || themeValue === 'dark';
        }
      )
    );
  });

  /**
   * Property 21.5: Theme persistence — after any toggle sequence, localStorage
   * always reflects the current theme.
   *
   * Validates: Requirements 3.9
   */
  it('Property 21.5: localStorage always reflects the current theme after any toggle sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (toggleCount) => {
          resetThemeState(localStorageMock);

          const { getByTestId, unmount } = render(
            <ThemeProvider>
              <ThemeConsumer />
              <ToggleConsumer />
            </ThemeProvider>
          );

          for (let i = 0; i < toggleCount; i++) {
            act(() => { fireEvent.click(getByTestId('toggle')); });
          }

          const themeValue = getByTestId('theme-value').textContent;
          const persisted = localStorageMock.getItem('theme');
          unmount();

          return themeValue === persisted;
        }
      )
    );
  });
});
