const isDevelopment = import.meta.env.DEV;

const noop = () => {};

export const logger = isDevelopment
  ? {
      info: (...args) => console.log('[INFO]', ...args),
      warn: (...args) => console.warn('[WARN]', ...args),
      error: (...args) => console.error('[ERROR]', ...args),
      debug: (...args) => console.debug('[DEBUG]', ...args),
      success: (...args) => console.log('[SUCCESS]', ...args),
    }
  : {
      info: noop,
      warn: noop,
      error: console.error, 
      debug: noop,
      success: noop,
    };
