import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Admin Dashboard Stats Hook
export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => apiService.getAdminDashboardStats(),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Admin Categories Hook
export const useAdminCategories = () => {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiService.getAdminCategories(),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Admin Questions Hook
export const useAdminQuestions = (params?: { categoryId?: string; page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: ['admin', 'questions', params],
    queryFn: () => apiService.getAdminQuestions(params),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Admin Users Hook
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiService.getAdminUsers(),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Admin Import Logs Hook
export const useAdminImportLogs = () => {
  return useQuery({
    queryKey: ['admin', 'import-logs'],
    queryFn: () => apiService.getAdminImportLogs(),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

