/**
 * Shared localStorage mock utility for tests
 * Reduces duplication across test files that need localStorage mocking
 */

export const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

export const setupLocalStorageMock = () => {
  const localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', { 
    value: localStorageMock, 
    writable: false 
  });
  return localStorageMock;
};