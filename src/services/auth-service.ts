import { API_BASE_URL, TOKEN_KEYS } from '@/shared/constants';
import { apiClient, setTokens, clearTokens } from './api-client';
import type { ClientResponse, LoginResponse, Admin } from '@/shared/types';

/**
 * Admin login
 */
export const login = async (
  email: string,
  password: string
): Promise<ClientResponse<LoginResponse>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.message || 'Login failed',
        success: false,
      };
    }

    // Store tokens
    if (data.data?.accessToken && data.data?.refreshToken) {
      setTokens(data.data.accessToken, data.data.refreshToken);
    }

    return {
      data: data.data,
      error: null,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    return {
      data: null,
      error: errorMessage,
      success: false,
    };
  }
};

/**
 * Admin logout
 */
export const logout = (): void => {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Get current admin profile
 */
export const getCurrentAdmin = async (): Promise<ClientResponse<{ admin: Admin }>> => {
  return apiClient<{ admin: Admin }>('/admin/me');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  return !!token;
};

const authService = {
  login,
  logout,
  getCurrentAdmin,
  isAuthenticated,
};

export default authService;
