import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceAPI } from '../services/api';
import { message } from 'antd';

// Get Categories Hook
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: practiceAPI.getCategories,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error: any) => {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
    },
  });
};

// Get Category by ID Hook
export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => practiceAPI.getCategoryById(categoryId),
    enabled: !!categoryId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching category:', error);
      message.error('Failed to load category details');
    },
  });
};

// Get Topics for Category Hook
export const useTopics = (category: string | undefined) => {
  return useQuery({
    queryKey: ['topics', category],
    queryFn: () => practiceAPI.getTopics(category!),
    enabled: !!category,
    retry: 2,
    staleTime: 10 * 60 * 1000,
    onError: (error: any) => {
      console.error('Error fetching topics:', error);
      message.error('Failed to load topics');
    },
  });
};

// Categories Management Hook
export const useCategoriesManager = () => {
  const queryClient = useQueryClient();

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  return {
    invalidateCategories,
  };
};
