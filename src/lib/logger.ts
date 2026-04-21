/**
 * Logging utility that only logs in development mode
 * Helps reduce console noise in production
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args: unknown[]) => {
    // Warnings are shown in dev and logged to error tracking in prod
    console.warn(...args);
  },

  error: (...args: unknown[]) => {
    // Errors should always be logged for debugging
    console.error(...args);
  },
};

/**
 * Convenience functions for specific logging contexts
 */
export const apiLogger = {
  request: (method: string, path: string) => {
    if (isDev) {
      console.log(`[API] ${method} ${path}`);
    }
  },

  error: (method: string, path: string, error: unknown) => {
    console.error(`[API ERROR] ${method} ${path}:`, error);
  },

  slow: (method: string, path: string, duration: number) => {
    if (isDev && duration > 1000) {
      console.warn(`[API SLOW] ${method} ${path} took ${duration}ms`);
    }
  },
};

export const dbLogger = {
  query: (query: string, duration?: number) => {
    if (isDev) {
      console.log(`[DB] ${query}`, duration ? `(${duration}ms)` : "");
    }
  },

  error: (query: string, error: unknown) => {
    console.error(`[DB ERROR] ${query}:`, error);
  },
};
