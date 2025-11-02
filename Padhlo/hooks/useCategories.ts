import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Get Categories Hook
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        console.log('[useCategories] Fetching practice categories...');
        const response = await apiService.getPracticeCategories();
        console.log('[useCategories] Categories fetched successfully:', {
          success: response?.success,
          hasData: !!response?.data,
          dataLength: Array.isArray(response?.data) ? response.data.length : 0
        });
        return response;
      } catch (error: any) {
        console.error('[useCategories] Error fetching categories:', {
          errorMessage: error?.message,
          errorName: error?.name,
          endpoint: error?.endpoint || '/practice/categories'
        });
        // Return a safe fallback structure instead of throwing
        // This prevents the app from crashing if the API call fails
        return {
          success: false,
          data: [],
          error: error?.message || 'Failed to load categories',
          message: error?.message || 'Network error loading practice categories'
        };
      }
    },
    retry: 1, // Reduce retries to fail faster
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000, // 10 minutes
    // Don't throw errors on failed queries - return error state instead
    throwOnError: false,
  });
};

// Get Topics for Category Hook
export const useTopics = (category: string | undefined) => {
  return useQuery({
    queryKey: ['topics', category],
    queryFn: () => category ? apiService.getPracticeTopics(category) : Promise.resolve({ success: true, data: [] }),
    enabled: !!category,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });
};


