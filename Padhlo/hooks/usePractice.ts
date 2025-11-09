import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Create Practice Session Hook
export const useCreatePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, timeLimitMinutes = 15, language = 'en' }: { 
      category: string; 
      timeLimitMinutes?: number; 
      language?: 'en' | 'mr' 
    }) => apiService.createPracticeSession(category, timeLimitMinutes, language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
    },
  });
};

// Get Practice Session Hook
export const usePracticeSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['practiceSession', sessionId],
    queryFn: () => apiService.getPracticeSession(sessionId),
    enabled: !!sessionId,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Update Practice Answer Hook
export const useUpdatePracticeAnswer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, questionId, userAnswer, timeSpentSeconds }: {
      sessionId: string;
      questionId: string;
      userAnswer: string;
      timeSpentSeconds: number;
    }) => apiService.updatePracticeAnswer(sessionId, questionId, userAnswer, timeSpentSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
    },
  });
};

// Complete Practice Session Hook
export const useCompletePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, timeSpentSeconds }: { sessionId: string; timeSpentSeconds?: number }) => 
      apiService.completePracticeSession(sessionId, timeSpentSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['practiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['progress', 'stats'] }); // Invalidate user stats query
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
    },
  });
};

// Get Practice History Hook
export const usePracticeHistory = () => {
  return useQuery({
    queryKey: ['practiceHistory'],
    queryFn: () => apiService.getPracticeHistory(),
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get Practice Stats Hook
export const usePracticeStats = () => {
  return useQuery({
    queryKey: ['practiceStats'],
    queryFn: () => apiService.getPracticeStats(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get Practice Categories Hook
export const usePracticeCategories = () => {
  return useQuery({
    queryKey: ['practiceCategories'],
    queryFn: () => apiService.getPracticeCategories(),
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

