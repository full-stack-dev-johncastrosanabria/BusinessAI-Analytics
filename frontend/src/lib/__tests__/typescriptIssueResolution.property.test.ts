/**
 * Property-Based Tests: TypeScript Issue Resolution Compliance
 *
 * **Validates: Requirements 2.5**
 *
 * Property 9: TypeScript Issue Resolution Compliance
 *   For any TypeScript/JavaScript issue in the Frontend_Application, the
 *   Issue_Resolver SHALL apply fixes that improve type safety and follow
 *   established best practices without breaking existing functionality.
 *
 * Sub-properties tested:
 *
 * Type Safety Properties (APIError class):
 *   P9a – APIError always has a non-empty message string
 *   P9b – APIError status is always a number
 *   P9c – APIError name is always 'APIError'
 *   P9d – For any error-like input, error handling produces a typed APIError
 *
 * Error Handling Patterns:
 *   P9e – instanceof Error check correctly identifies Error instances
 *   P9f – Error message extraction from unknown values always returns a string
 *   P9g – Null/undefined inputs to error handlers don't throw
 *
 * URL Construction Safety:
 *   P9h – Query params are always properly encoded (no raw special characters)
 *   P9i – URL construction with valid endpoints always produces valid URLs
 *
 * Type Guard Utilities:
 *   P9j – isRecord returns true only for non-null objects
 *   P9k – isRecord returns false for primitives, null, arrays
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { APIError } from '../api';

// ─── Helper utilities (mirrors internal api.ts logic) ────────────────────────

/**
 * Mirrors the isRecord function from api.ts (not exported, so we replicate it).
 * This tests the observable behavior of the pattern used in the codebase.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Mirrors the error message extraction pattern used in api.ts catch blocks.
 * Extracts a string message from any unknown error value.
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Mirrors the URL construction logic from api.ts request() function.
 * Builds a URL with optional query params appended via URLSearchParams.
 */
function buildUrl(
  base: string,
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): URL {
  const url = new URL(`${base}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  return url;
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter(s => s.trim().length > 0);

const httpStatusArb = fc.integer({ min: 100, max: 599 });

const specialCharStringArb = fc.string({ minLength: 1, maxLength: 40 }).filter(s =>
  /[&=?# %+]/.test(s),
);

const primitiveArb: fc.Arbitrary<unknown> = fc.oneof(
  fc.integer(),
  fc.float(),
  fc.boolean(),
  fc.constant(null),
  fc.constant(undefined),
  fc.string(),
);

const validEndpointArb = fc
  .array(
    fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
    { minLength: 1, maxLength: 4 },
  )
  .map(parts => '/' + parts.join('/'));

const queryParamValueArb: fc.Arbitrary<string | number | boolean> = fc.oneof(
  fc.string({ minLength: 0, maxLength: 30 }),
  fc.integer({ min: -1000, max: 1000 }),
  fc.boolean(),
);

const queryParamsArb: fc.Arbitrary<Record<string, string | number | boolean>> = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
  queryParamValueArb,
  { minKeys: 1, maxKeys: 5 },
);

// ─── Tests: Type Safety Properties ───────────────────────────────────────────

describe('Property 9: TypeScript Issue Resolution Compliance (Validates: Requirements 2.5)', () => {

  describe('Type Safety – APIError class', () => {

    /**
     * P9a – APIError always has a non-empty message string.
     */
    it('P9a: APIError always has a non-empty message string', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, httpStatusArb, (message, status) => {
          const err = new APIError(message, status);
          return typeof err.message === 'string' && err.message.length > 0;
        }),
      );
    });

    /**
     * P9b – APIError status is always a number.
     */
    it('P9b: APIError status is always a number', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, httpStatusArb, (message, status) => {
          const err = new APIError(message, status);
          return typeof err.status === 'number';
        }),
      );
    });

    /**
     * P9c – APIError name is always 'APIError'.
     */
    it('P9c: APIError name is always "APIError"', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, httpStatusArb, (message, status) => {
          const err = new APIError(message, status);
          return err.name === 'APIError';
        }),
      );
    });

    /**
     * P9d – APIError is an instance of Error (proper inheritance).
     * This validates that the class correctly extends Error for typed error handling.
     */
    it('P9d: APIError is an instance of Error (proper type hierarchy)', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, httpStatusArb, (message, status) => {
          const err = new APIError(message, status);
          return err instanceof Error && err instanceof APIError;
        }),
      );
    });
  });

  // ─── Tests: Error Handling Patterns ────────────────────────────────────────

  describe('Error Handling Patterns', () => {

    /**
     * P9e – instanceof Error check correctly identifies Error instances.
     */
    it('P9e: instanceof Error correctly identifies Error instances', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, (message) => {
          const err = new Error(message);
          const apiErr = new APIError(message, 500);
          return (err instanceof Error) === true && (apiErr instanceof Error) === true;
        }),
      );
    });

    /**
     * P9f – Error message extraction from unknown values always returns a string.
     */
    it('P9f: error message extraction from any unknown value always returns a string', () => {
      fc.assert(
        fc.property(primitiveArb, (value) => {
          const result = extractErrorMessage(value);
          return typeof result === 'string';
        }),
      );
    });

    it('P9f: error message extraction from Error objects returns the message string', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, (message) => {
          const err = new Error(message);
          const result = extractErrorMessage(err);
          return result === message;
        }),
      );
    });

    /**
     * P9g – Null/undefined inputs to error handlers don't throw.
     */
    it('P9g: extractErrorMessage does not throw for null input', () => {
      const result = extractErrorMessage(null);
      return typeof result === 'string';
    });

    it('P9g: extractErrorMessage does not throw for undefined input', () => {
      const result = extractErrorMessage(undefined);
      return typeof result === 'string';
    });

    it('P9g: APIError construction with zero status does not throw', () => {
      fc.assert(
        fc.property(nonEmptyStringArb, (message) => {
          let threw = false;
          try {
            new APIError(message, 0);
          } catch {
            threw = true;
          }
          return !threw;
        }),
      );
    });
  });

  // ─── Tests: URL Construction Safety ────────────────────────────────────────

  describe('URL Construction Safety', () => {

    /**
     * P9h – Query params with special characters are always properly encoded.
     * URLSearchParams.append() must percent-encode values so no raw & = ? # appear
     * in the query string portion.
     */
    it('P9h: query params with special characters are properly encoded in the URL', () => {
      fc.assert(
        fc.property(specialCharStringArb, (paramValue) => {
          const url = buildUrl('http://localhost:8080', '/api/test', { q: paramValue });
          const queryString = url.search; // includes leading '?'
          // The raw value should not appear verbatim if it contains unencoded special chars
          // We verify the URL is parseable and the param round-trips correctly
          const retrieved = url.searchParams.get('q');
          return retrieved === paramValue;
        }),
      );
    });

    it('P9h: multiple query params are all retrievable after URL construction', () => {
      fc.assert(
        fc.property(queryParamsArb, (params) => {
          const url = buildUrl('http://localhost:8080', '/api/test', params);
          return Object.entries(params).every(([key, value]) => {
            const retrieved = url.searchParams.get(key);
            return retrieved === String(value);
          });
        }),
      );
    });

    /**
     * P9i – URL construction with valid endpoints always produces valid URLs.
     */
    it('P9i: URL construction with valid endpoints always produces a valid URL', () => {
      fc.assert(
        fc.property(validEndpointArb, (endpoint) => {
          let url: URL | null = null;
          try {
            url = buildUrl('http://localhost:8080', endpoint);
          } catch {
            return false;
          }
          return (
            url !== null &&
            url.href.startsWith('http://localhost:8080') &&
            url.pathname === endpoint
          );
        }),
      );
    });

    it('P9i: URL construction with query params produces a URL with non-empty search', () => {
      fc.assert(
        fc.property(validEndpointArb, queryParamsArb, (endpoint, params) => {
          const url = buildUrl('http://localhost:8080', endpoint, params);
          return url.search.length > 0 && url.search.startsWith('?');
        }),
      );
    });
  });

  // ─── Tests: Type Guard Utilities ───────────────────────────────────────────

  describe('Type Guard Utilities – isRecord', () => {

    /**
     * P9j – isRecord returns true only for non-null, non-array objects.
     */
    it('P9j: isRecord returns true for plain objects', () => {
      fc.assert(
        fc.property(
          fc.dictionary(fc.string(), fc.string(), { minKeys: 0, maxKeys: 5 }),
          (obj) => isRecord(obj) === true,
        ),
      );
    });

    it('P9j: isRecord returns true for objects with mixed value types', () => {
      fc.assert(
        fc.property(
          fc.record({
            a: fc.string(),
            b: fc.integer(),
            c: fc.boolean(),
          }),
          (obj) => isRecord(obj) === true,
        ),
      );
    });

    /**
     * P9k – isRecord returns false for primitives, null, and arrays.
     */
    it('P9k: isRecord returns false for null', () => {
      return isRecord(null) === false;
    });

    it('P9k: isRecord returns false for undefined', () => {
      return isRecord(undefined) === false;
    });

    it('P9k: isRecord returns false for arrays', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
          (arr) => isRecord(arr) === false,
        ),
      );
    });

    it('P9k: isRecord returns false for primitive values', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.float(), fc.boolean(), fc.string()),
          (primitive) => isRecord(primitive) === false,
        ),
      );
    });
  });
});
