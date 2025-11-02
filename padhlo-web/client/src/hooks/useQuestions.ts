import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import { practiceAPI } from '../services/api';
import { message } from 'antd';

// Get Category by ID Hook
export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => {
      const category = dataService.getCategoryById(categoryId);
      return Promise.resolve(category);
    },
    enabled: !!categoryId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    onError: (error: any) => {
      console.error('Error fetching category:', error);
      message.error('Failed to load category details');
    },
  });
};

// Create Practice Session Hook (using dataService)
export const useCreateDataServicePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, timeLimitMinutes }: { categoryId: string; timeLimitMinutes: number }) =>
      practiceAPI.createSession(categoryId, timeLimitMinutes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
      message.success('Practice session created successfully!');
      return data.data;
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to create practice session');
    },
  });
};

// Get Practice Session Hook (using dataService)
export const useDataServicePracticeSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['dataServicePracticeSession', sessionId],
    queryFn: () => dataService.getPracticeSession(sessionId),
    enabled: !!sessionId,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    onError: (error: any) => {
      console.error('Error fetching practice session:', error);
      message.error('Failed to load practice session');
    },
  });
};

// Update Practice Answer Hook (using dataService)
export const useUpdateDataServicePracticeAnswer = () => {
  return useMutation({
    mutationFn: ({ sessionId, questionId, userAnswer, timeSpentSeconds }: {
      sessionId: string;
      questionId: string;
      userAnswer: string;
      timeSpentSeconds: number;
    }) => dataService.updatePracticeAnswer(sessionId, questionId, userAnswer, timeSpentSeconds),
    onError: (error: any) => {
      console.error('Error updating practice answer:', error);
      message.error('Failed to save answer');
    },
  });
};

// Complete Practice Session Hook (using dataService)
export const useCompleteDataServicePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => dataService.completePracticeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['practiceStats'] });
      message.success('Practice session completed successfully!');
    },
    onError: (error: any) => {
      message.error(error.message || 'Failed to complete practice session');
    },
  });
};

// Get Practice History Hook (using dataService)
export const useDataServicePracticeHistory = () => {
  return useQuery({
    queryKey: ['dataServicePracticeHistory'],
    queryFn: dataService.getUserPracticeHistory,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching practice history:', error);
      message.error('Failed to load practice history');
    },
  });
};

// Get Practice Stats Hook (using dataService)
export const useDataServicePracticeStats = () => {
  return useQuery({
    queryKey: ['dataServicePracticeStats'],
    queryFn: dataService.getUserPracticeStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching practice stats:', error);
      message.error('Failed to load practice statistics');
    },
  });
};

// Sample Questions Hook (for home page)
export const useSampleQuestions = (categoryId: string) => {
  return useQuery({
    queryKey: ['sampleQuestions', categoryId],
    queryFn: () => practiceAPI.createSession(categoryId, 15),
    enabled: !!categoryId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching sample questions:', error);
      // Don't show error message for sample questions as it's not critical
    },
  });
};

// Data Service Management Hook
export const useDataServiceManager = () => {
  const queryClient = useQueryClient();

  const createSession = useCreateDataServicePracticeSession();
  const updateAnswer = useUpdateDataServicePracticeAnswer();
  const completeSession = useCompleteDataServicePracticeSession();

  const invalidateSession = (sessionId: string) => {
    queryClient.invalidateQueries({ queryKey: ['dataServicePracticeSession', sessionId] });
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dataServicePracticeHistory'] });
    queryClient.invalidateQueries({ queryKey: ['dataServicePracticeStats'] });
  };

  return {
    createSession,
    updateAnswer,
    completeSession,
    invalidateSession,
    invalidateAll,
  };
};
