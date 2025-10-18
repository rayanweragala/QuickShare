const isDevelopment = import.meta.env.DEV;

export const logger = {
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  success: (...args) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  },
}