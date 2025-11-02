import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statisticsAPI } from '../services/api';
import { message } from 'antd';

// Get user statistics hook
export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['userStatistics'],
    queryFn: statisticsAPI.getUserStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Update practice statistics hook
export const useUpdatePracticeStatistics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: statisticsAPI.updatePracticeStatistics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error: any) => {
      console.error('Error updating practice statistics:', error);
    },
  });
};

// Update exam statistics hook
export const useUpdateExamStatistics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: statisticsAPI.updateExamStatistics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: (error: any) => {
      console.error('Error updating exam statistics:', error);
    },
  });
};

// Get leaderboard hook
export const useLeaderboard = (period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime', category: 'overall' | 'practice' | 'exam' | 'streak' | 'accuracy' = 'overall', subjectId?: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['leaderboard', period, category, subjectId, limit],
    queryFn: () => statisticsAPI.getLeaderboard(period, category, subjectId, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Get user rank hook
export const useUserRank = (period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime') => {
  return useQuery({
    queryKey: ['userRank', period],
    queryFn: () => statisticsAPI.getUserRank(period),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Get available subjects hook
export const useAvailableSubjects = () => {
  return useQuery({
    queryKey: ['availableSubjects'],
    queryFn: statisticsAPI.getAvailableSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Statistics manager hook
export const useStatisticsManager = () => {
  const queryClient = useQueryClient();

  const invalidateStatistics = () => {
    queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['userRank'] });
  };

  return {
    invalidateStatistics,
  };
};
