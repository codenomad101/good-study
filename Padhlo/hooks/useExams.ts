import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Exam Creation Hook
export const useCreateDynamicExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (examConfig: any) => {
      console.log('[useExams] Creating exam with config:', examConfig);
      try {
        const result = await apiService.createDynamicExam(examConfig);
        console.log('[useExams] Exam creation API result received:', {
          success: result?.success,
          hasData: !!result?.data,
          dataType: typeof result?.data,
          endpoint: '/exam/dynamic/create'
        });
        
        // Ensure we return a clean object (no response references)
        const cleanResult = {
          success: result.success,
          data: result.data,
          message: result.message
        };
        
        console.log('[useExams] Returning clean result');
        return cleanResult;
      } catch (error: any) {
        console.error('[useExams] Error in createDynamicExam mutationFn:', {
          errorName: error?.name,
          errorMessage: error?.message,
          endpoint: error?.endpoint || '/exam/dynamic/create',
          originalError: error?.originalError,
          stack: error?.stack
        });
        // Re-throw with more context
        const enhancedError = new Error(
          error?.message || 'Failed to create exam session'
        );
        (enhancedError as any).originalError = error;
        (enhancedError as any).endpoint = error?.endpoint || '/exam/dynamic/create';
        throw enhancedError;
      }
    },
    onSuccess: (data) => {
      console.log('[useExams] ✅ Exam creation successful, sessionId:', data?.data?.sessionId || 'N/A');
      // Invalidate queries asynchronously to avoid blocking
      // Use setTimeout with error handling to prevent invalidation errors from affecting the mutation
      setTimeout(() => {
        try {
          queryClient.invalidateQueries({ queryKey: ['examHistory'] });
          console.log('[useExams] History query invalidated successfully');
        } catch (invalidationError: any) {
          console.warn('[useExams] Warning: Error invalidating history query (non-critical):', invalidationError?.message);
          // Don't throw - this is a non-critical operation
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error('[useExams] ❌ Exam creation mutation error:', {
        errorMessage: error?.message,
        errorName: error?.name,
        endpoint: error?.endpoint || 'unknown',
        isNetworkError: error?.message?.includes('Network') || error?.message?.includes('fetch')
      });
    }
  });
};

// Start Exam Hook
export const useStartExam = () => {
  return useMutation({
    mutationFn: (sessionId: string) => apiService.startDynamicExam(sessionId),
  });
};

// Get Exam Questions Hook
export const useExamQuestions = (sessionId: string) => {
  return useQuery({
    queryKey: ['examQuestions', sessionId],
    queryFn: () => apiService.getDynamicExamQuestions(sessionId),
    enabled: !!sessionId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Complete Exam Hook
export const useCompleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, examData }: { sessionId: string; examData: any }) =>
      apiService.completeDynamicExam(sessionId, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examHistory'] });
      queryClient.invalidateQueries({ queryKey: ['examStats'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
    },
  });
};

// Get Exam History Hook
export const useExamHistory = () => {
  return useQuery({
    queryKey: ['examHistory'],
    queryFn: () => apiService.getDynamicExamHistory(),
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get Exam Stats Hook
export const useExamStats = () => {
  return useQuery({
    queryKey: ['examStats'],
    queryFn: () => apiService.getDynamicExamStats(),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Resume Exam Hook
export const useResumeExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => apiService.resumeDynamicExam(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examHistory'] });
    },
  });
};


