import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Strata, ApiResponse, IGroupServerConfig } from '@/types';
import {
  fetchStratas,
  createStrata as createStrataService,
  updateStrata as updateStrataService,
  deleteStrata as deleteStrataService,
} from '../services/strataService';

export const useStrataData = () => {
  const { t } = useTranslation();
  const [stratas, setStratas] = useState<Strata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStratas = useCallback(async () => {
    try {
      setLoading(true);
      const response: ApiResponse<Strata[]> = await fetchStratas();

      if (response && response.success && Array.isArray(response.data)) {
        setStratas(response.data);
      } else {
        console.error('Invalid strata data format:', response);
        setStratas([]);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching stratas:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stratas');
      setStratas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger a refresh of the stratas data
  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Create a new strata with server associations
  const createStrata = async (
    name: string,
    description?: string,
    servers: IGroupServerConfig[] = [],
  ) => {
    try {
      const result: ApiResponse<Strata> = await createStrataService({
        name,
        description,
        servers,
      });
      console.log('Strata created successfully:', result);

      if (!result || !result.success) {
        setError(result?.message || t('stratas.createError'));
        return result;
      }

      triggerRefresh();
      return result || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create strata');
      return null;
    }
  };

  // Update an existing strata with server associations
  const updateStrata = async (
    id: string,
    data: { name?: string; description?: string; servers?: IGroupServerConfig[] },
  ) => {
    try {
      const result: ApiResponse<Strata> = await updateStrataService(id, data);
      if (!result || !result.success) {
        setError(result?.message || t('stratas.updateError'));
        return result;
      }

      triggerRefresh();
      return result || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update strata');
      return null;
    }
  };

  // Delete a strata
  const deleteStrata = async (id: string) => {
    try {
      const result = await deleteStrataService(id);
      if (!result || !result.success) {
        setError(result?.message || t('stratas.deleteError'));
        return result;
      }

      triggerRefresh();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete strata');
      return null;
    }
  };

  // Fetch stratas when the component mounts or refreshKey changes
  useEffect(() => {
    loadStratas();
  }, [loadStratas, refreshKey]);

  return {
    stratas,
    loading,
    error,
    setError,
    triggerRefresh,
    createStrata,
    updateStrata,
    deleteStrata,
  };
};
