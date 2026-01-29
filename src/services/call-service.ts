import { apiClient } from './api-client';
import type { ClientResponse, PaginatedResponse } from '@/shared/types';

export interface TargetPrice {
  _id?: string;
  price: number;
  label: string;
  order: number;
  isAcheived: boolean;
}

export interface Call {
  id: string;
  _id?: string;
  commodity: 'Gold' | 'Silver' | 'Copper' | 'Crude' | 'CMX Gold' | 'CMX Silver' | 'Custom';
  customCommodity?: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  target?: number;
  targetPrices: TargetPrice[];
  stopLoss: number;
  analysis: string;
  tradeType: 'intraday' | 'short_term';
  status: 'active' | 'partial_hit' | 'all_hit' | 'hit_stoploss' | 'expired';
  date: string;
  createdBy?: {
    _id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCallData {
  commodity: string;
  customCommodity?: string;
  type: string;
  entryPrice: number;
  targetPrices: TargetPrice[];
  stopLoss: number;
  analysis: string;
  date: string;
  status?: string;
  tradeType?: 'intraday' | 'short_term';
}

export interface GetCallsParams {
  page?: number;
  limit?: number;
  commodity?: string;
  status?: string;
  type?: string;
  tradeType?: 'intraday' | 'short_term';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all calls with filters and pagination
 */
export const getCalls = async (
  params: GetCallsParams = {}
): Promise<ClientResponse<PaginatedResponse<Call>>> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.commodity) searchParams.set('commodity', params.commodity);
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.tradeType) searchParams.set('tradeType', params.tradeType);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/admin/calls?${queryString}` : '/admin/calls';

  return apiClient<PaginatedResponse<Call>>(endpoint);
};

/**
 * Get a single call by ID
 */
export const getCallById = async (id: string): Promise<ClientResponse<{ call: Call }>> => {
  return apiClient<{ call: Call }>(`/admin/calls/${id}`);
};

/**
 * Create a new call
 */
export const createCall = async (data: CreateCallData): Promise<ClientResponse<{ call: Call }>> => {
  return apiClient<{ call: Call }>('/admin/calls', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Update a call
 */
export const updateCall = async (
  id: string,
  data: Partial<CreateCallData>
): Promise<ClientResponse<{ call: Call }>> => {
  return apiClient<{ call: Call }>(`/admin/calls/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a call
 */
export const deleteCall = async (id: string): Promise<ClientResponse<{ message: string }>> => {
  return apiClient<{ message: string }>(`/admin/calls/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Update target achievement status
 */
export const updateTargetStatus = async (
  callId: string,
  targetId: string,
  isAcheived: boolean
): Promise<ClientResponse<Call>> => {
  const response = await apiClient<{ call: Call }>(`/admin/calls/${callId}/targets/${targetId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isAcheived }),
  });
  return {
    ...response,
    data: response.data ? response.data.call : null,
  };
};

const callService = {
  getCalls,
  getCallById,
  createCall,
  updateCall,
  deleteCall,
  updateTargetStatus,
};

export default callService;
