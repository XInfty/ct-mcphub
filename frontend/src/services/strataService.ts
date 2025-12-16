import { apiGet, apiPost, apiPut, apiDelete } from '../utils/fetchInterceptor';
import { ApiResponse, Strata, IGroupServerConfig } from '@/types';

/**
 * Fetch all stratas
 */
export const fetchStratas = async (): Promise<ApiResponse<Strata[]>> => {
  try {
    const response = await apiGet<ApiResponse<Strata[]>>('/stratas');
    return response;
  } catch (error) {
    console.error('Error fetching stratas:', error);
    throw error;
  }
};

/**
 * Fetch a single strata by ID or name
 */
export const fetchStrata = async (id: string): Promise<ApiResponse<Strata>> => {
  try {
    const response = await apiGet<ApiResponse<Strata>>(`/stratas/${id}`);
    return response;
  } catch (error) {
    console.error(`Error fetching strata ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new strata
 */
export const createStrata = async (data: {
  name: string;
  description?: string;
  servers?: IGroupServerConfig[];
}): Promise<ApiResponse<Strata>> => {
  try {
    const response = await apiPost<ApiResponse<Strata>>('/stratas', data);
    return response;
  } catch (error) {
    console.error('Error creating strata:', error);
    throw error;
  }
};

/**
 * Update an existing strata
 */
export const updateStrata = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    servers?: IGroupServerConfig[];
  },
): Promise<ApiResponse<Strata>> => {
  try {
    const response = await apiPut<ApiResponse<Strata>>(`/stratas/${id}`, data);
    return response;
  } catch (error) {
    console.error(`Error updating strata ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a strata
 */
export const deleteStrata = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await apiDelete<ApiResponse<void>>(`/stratas/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting strata ${id}:`, error);
    throw error;
  }
};
