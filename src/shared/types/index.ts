// Standard API response interface
export interface ClientResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Paginated response interface
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Admin user interface
export interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: string;
}

// User interface
export interface User {
  id: string;
  firebaseUid: string | null;
  fullName: string | null;
  mobile: string;
  city: string | null;
  isActive: boolean;
  subscription: Subscription;
  hasActiveSubscription: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subscription interface
export interface Subscription {
  plan: 'daily' | 'weekly' | 'custom' | null;
  planTier?: 'Regular' | 'Premium' | 'International' | 'None';
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isUnlimited?: boolean;
}

// Call interface
export interface Call {
  id: string;
  commodity: 'gold' | 'silver' | 'nifty' | 'copper';
  type: 'buy' | 'sell';
  entryPrice: number;
  target: number;
  stopLoss: number;
  status: 'active' | 'hit_target' | 'hit_stoploss' | 'expired';
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Auth tokens interface
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Login response interface
export interface LoginResponse {
  admin: Admin;
  accessToken: string;
  refreshToken: string;
}
