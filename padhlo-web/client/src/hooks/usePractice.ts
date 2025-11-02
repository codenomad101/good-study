import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceAPI } from '../services/api';
import { message } from 'antd';

// Create Practice Session Hook
export const useCreatePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: practiceAPI.createSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
      message.success('Practice session started successfully!');
      return data;
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to start practice session');
    },
  });
};

// Get Practice Session Hook
export const usePracticeSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['practiceSession', sessionId],
    queryFn: () => practiceAPI.getSession(sessionId),
    enabled: !!sessionId,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    onError: (error: any) => {
      console.error('Error fetching practice session:', error);
      message.error('Failed to load practice session');
    },
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
    }) => practiceAPI.updateAnswer(sessionId, questionId, userAnswer, timeSpentSeconds),
    onSuccess: () => {
      // Invalidate statistics cache to update real-time stats
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
    },
    onError: (error: any) => {
      console.error('Error updating practice answer:', error);
      message.error('Failed to save answer');
    },
  });
};

// Complete Practice Session Hook
export const useCompletePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => practiceAPI.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['practiceStats'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
      queryClient.invalidateQueries({ queryKey: ['availableSubjects'] });
      message.success('Practice session completed successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to complete practice session');
    },
  });
};

// Get Practice History Hook
export const usePracticeHistory = () => {
  return useQuery({
    queryKey: ['practiceHistory'],
    queryFn: practiceAPI.getHistory,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching practice history:', error);
      message.error('Failed to load practice history');
    },
  });
};

// Get Practice Stats Hook
export const usePracticeStats = () => {
  return useQuery({
    queryKey: ['practiceStats'],
    queryFn: practiceAPI.getStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching practice stats:', error);
      message.error('Failed to load practice statistics');
    },
  });
};

// Get Practice Categories Hook
export const usePracticeCategories = () => {
  return useQuery({
    queryKey: ['practiceCategories'],
    queryFn: practiceAPI.getCategories,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error: any) => {
      console.error('Error fetching practice categories:', error);
      message.error('Failed to load practice categories');
    },
  });
};

// Practice Session Management Hook
export const usePracticeSessionManager = () => {
  const queryClient = useQueryClient();

  const createSession = useCreatePracticeSession();
  const updateAnswer = useUpdatePracticeAnswer();
  const completeSession = useCompletePracticeSession();

  const invalidateSession = (sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: ['practiceSession', sessionId] });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
    queryClient.invalidateQueries({ queryKey: ['practiceStats'] });
  };

  return {
    createSession,
    updateAnswer,
    completeSession,
    invalidateSession,
    invalidateAll,
  };
};
