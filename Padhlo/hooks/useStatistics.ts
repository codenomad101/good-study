import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Get user statistics hook
export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['userStatistics'],
    queryFn: () => apiService.getUserStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get leaderboard hook
export const useLeaderboard = (
  period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime', 
  category: 'overall' | 'practice' | 'exam' | 'streak' | 'accuracy' = 'overall', 
  subjectId?: string, 
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['leaderboard', period, category, subjectId, limit],
    queryFn: async () => {
      try {
        return await apiService.getLeaderboard(period, category, subjectId, limit);
      } catch (error: any) {
        console.warn('[useStatistics] getLeaderboard error:', {
          message: error?.message,
          endpoint: error?.endpoint || '/statistics/leaderboard'
        });
        return { success: false, data: [], message: error?.message || 'Failed to load leaderboard' };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    throwOnError: false,
  });
};

// Get user rank hook
export const useUserRank = (period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime') => {
  return useQuery({
    queryKey: ['userRank', period],
    queryFn: async () => {
      try {
        return await apiService.getUserRank(period);
      } catch (error: any) {
        console.warn('[useStatistics] getUserRank error:', {
          message: error?.message,
          endpoint: error?.endpoint || '/statistics/user-rank'
        });
        return { success: false, data: null, message: error?.message || 'Failed to load user rank' };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    throwOnError: false,
  });
};

// Get available subjects hook
export const useAvailableSubjects = () => {
  return useQuery({
    queryKey: ['availableSubjects'],
    queryFn: async () => {
      try {
        return await apiService.getAvailableSubjects();
      } catch (error: any) {
        console.warn('[useStatistics] getAvailableSubjects error:', {
          message: error?.message,
          endpoint: error?.endpoint || '/statistics/subjects'
        });
        return { success: false, data: [], message: error?.message || 'Failed to load subjects' };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    throwOnError: false,
  });
};

