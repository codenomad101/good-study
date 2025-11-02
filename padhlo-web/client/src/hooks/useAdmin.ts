import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { message } from 'antd';

// Get Categories Hook
export const useAdminCategories = (params?: any) => {
  return useQuery({
    queryKey: ['adminCategories', params],
    queryFn: () => adminAPI.getCategories(params),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching admin categories:', error);
      message.error('Failed to load categories');
    },
  });
};

// Create Category Hook
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminAPI.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Category created successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create category');
    },
  });
};

// Update Category Hook
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, categoryData }: { categoryId: string; categoryData: any }) =>
      adminAPI.updateCategory(categoryId, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Category updated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update category');
    },
  });
};

// Delete Category Hook
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminAPI.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Category deleted successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete category');
    },
  });
};

// Get Questions Hook
export const useAdminQuestions = (params?: any) => {
  return useQuery({
    queryKey: ['adminQuestions', params],
    queryFn: () => adminAPI.getQuestions(params),
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching admin questions:', error);
      message.error('Failed to load questions');
    },
  });
};

// Delete Question Hook
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminAPI.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      message.success('Question deleted successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete question');
    },
  });
};

// Import Questions Hook
export const useImportQuestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, file }: { categoryId: string; file: File }) =>
      adminAPI.importQuestions(categoryId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      message.success('Questions imported successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to import questions');
    },
  });
};

// Get Import Logs Hook
export const useImportLogs = (params?: any) => {
  return useQuery({
    queryKey: ['importLogs', params],
    queryFn: () => adminAPI.getImportLogs(params),
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    onError: (error: any) => {
      console.error('Error fetching import logs:', error);
      message.error('Failed to load import logs');
    },
  });
};

// Get Users Hook
export const useAdminUsers = (params?: any) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => adminAPI.getUsers(params),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching admin users:', error);
      message.error('Failed to load users');
    },
  });
};

// Update User Hook
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: any }) =>
      adminAPI.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      message.success('User updated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update user');
    },
  });
};

// Admin Management Hook
export const useAdminManager = () => {
  const queryClient = useQueryClient();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const deleteQuestion = useDeleteQuestion();
  const importQuestions = useImportQuestions();
  const updateUser = useUpdateUser();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    queryClient.invalidateQueries({ queryKey: ['importLogs'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    deleteQuestion,
    importQuestions,
    updateUser,
    invalidateAll,
  };
};
