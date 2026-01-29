import { API_BASE_URL, TOKEN_KEYS } from '@/shared/constants';
// Backwards compatibility for legacy token keys. We read/convert legacy keys if present.
const LEGACY_TOKEN_KEYS = {
  ACCESS_TOKEN: 'varlyq_access_token',
  REFRESH_TOKEN: 'varlyq_refresh_token',
} as const;
import type { ClientResponse } from '@/shared/types';

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // If the old legacy token exists and the new token is absent, migrate it
  try {
    const newToken = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    if (!newToken) {
      const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEYS.ACCESS_TOKEN);
      if (legacyToken) {
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, legacyToken);
        localStorage.removeItem(LEGACY_TOKEN_KEYS.ACCESS_TOKEN);
        return legacyToken;
      }
    }
  } catch (err) {
    // If localStorage access fails for some reason, fallthrough to normal read
    // (e.g., in some restricted browser environments)
  }
  return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const newToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    if (!newToken) {
      const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEYS.REFRESH_TOKEN);
      if (legacyToken) {
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, legacyToken);
        localStorage.removeItem(LEGACY_TOKEN_KEYS.REFRESH_TOKEN);
        return legacyToken;
      }
    }
  } catch (err) {}
  return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
};

/**
 * Store tokens
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  // Save to the new keys
  localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
  // Remove legacy keys (migration step)
  try {
    if (localStorage.getItem(LEGACY_TOKEN_KEYS.ACCESS_TOKEN)) {
      localStorage.removeItem(LEGACY_TOKEN_KEYS.ACCESS_TOKEN);
    }
    if (localStorage.getItem(LEGACY_TOKEN_KEYS.REFRESH_TOKEN)) {
      localStorage.removeItem(LEGACY_TOKEN_KEYS.REFRESH_TOKEN);
    }
  } catch (err) {
    // ignore - cannot remove
  }
};

/**
 * Clear tokens
 */
export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  // Remove both new and legacy keys
  localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(LEGACY_TOKEN_KEYS.REFRESH_TOKEN);
  } catch (err) {
    // ignore
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.data?.accessToken && data.data?.refreshToken) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return data.data.accessToken;
    }

    return null;
  } catch {
    clearTokens();
    return null;
  }
};

/**
 * API client with automatic token refresh
 */
export const apiClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ClientResponse<T>> => {
  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  };

  try {
    const token = getAccessToken();
    let response = await makeRequest(token);

    // If unauthorized, try to refresh token
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await makeRequest(newToken);
      } else {
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return { data: null, error: 'Session expired', success: false };
      }
    }

    // Safely parse JSON or handle empty response
    let data: any = null;
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    // Some responses (like 204 No Content) have no body
    if (response.status !== 204 && isJson) {
      try {
        data = await response.json();
      } catch (err) {
        console.error('Error parsing JSON response:', err);
      }
    }

    if (!response.ok) {
      return {
        data: null,
        error: data?.message || 'An error occurred',
        success: false,
      };
    }

    // Preserve pagination wrapper if provided by backend
    // - If backend returns { data: <payload>, pagination: {...} }, keep that wrapper
    // - If backend returns { data: <payload> } (no pagination), unwrap to payload for convenience
    // - Otherwise, return full body as payload
    const hasPagination = data && Object.prototype.hasOwnProperty.call(data, 'pagination');
    const payload = hasPagination ? { data: data.data, pagination: data.pagination } : (data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data);

    return {
      data: payload,
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

export default apiClient;
