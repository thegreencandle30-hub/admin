// API Base URL from environment
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'green_candle_access_token',
  REFRESH_TOKEN: 'green_candle_refresh_token',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Commodity types
export const COMMODITIES = ['gold', 'silver', 'nifty', 'copper'] as const;

// Call types
export const CALL_TYPES = ['buy', 'sell'] as const;

// Call statuses
export const CALL_STATUSES = ['active', 'hit_target', 'hit_stoploss', 'expired'] as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = ['daily', 'weekly'] as const;
