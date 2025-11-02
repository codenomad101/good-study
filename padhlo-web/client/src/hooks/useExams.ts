import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examAPI } from '../services/api';
import { message } from 'antd';

// Exam Creation Hook
export const useCreateDynamicExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: examAPI.createDynamicExam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examHistory'] });
      message.success('Dynamic exam created successfully!');
      return data;
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create exam');
    },
  });
};

// Start Exam Hook
export const useStartExam = () => {
  return useMutation({
    mutationFn: examAPI.startExam,
    onSuccess: () => {
      message.success('Exam started successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to start exam');
    },
  });
};

// Get Exam Questions Hook
export const useExamQuestions = (sessionId: string) => {
  return useQuery({
    queryKey: ['examQuestions', sessionId],
    queryFn: () => examAPI.getQuestions(sessionId),
    enabled: !!sessionId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching exam questions:', error);
      message.error('Failed to load exam questions');
    },
  });
};

// Complete Exam Hook
export const useCompleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, examData }: { sessionId: string; examData: any }) =>
      examAPI.completeExam(sessionId, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examHistory'] });
      queryClient.invalidateQueries({ queryKey: ['examStats'] });
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userRank'] });
      queryClient.invalidateQueries({ queryKey: ['availableSubjects'] });
      message.success('Exam completed successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to complete exam');
    },
  });
};

// Get Exam History Hook
export const useExamHistory = () => {
  return useQuery({
    queryKey: ['examHistory'],
    queryFn: examAPI.getExamHistory,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching exam history:', error);
      message.error('Failed to load exam history');
    },
  });
};

// Get Exam Stats Hook
export const useExamStats = () => {
  return useQuery({
    queryKey: ['examStats'],
    queryFn: examAPI.getExamStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching exam stats:', error);
      message.error('Failed to load exam statistics');
    },
  });
};

// Get Single Exam Session Hook
export const useExamSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['examSession', sessionId],
    queryFn: () => examAPI.getQuestions(sessionId), // This should be getExamSession when implemented
    enabled: !!sessionId,
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    onError: (error: any) => {
      console.error('Error fetching exam session:', error);
      message.error('Failed to load exam session');
    },
  });
};

// Exam Configuration Hook
export const useExamConfiguration = () => {
  return useMutation({
    mutationFn: (config: any) => examAPI.createDynamicExam(config),
    onSuccess: (data) => {
      message.success('Exam configuration saved!');
      return data;
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to save exam configuration');
    },
  });
};

// Resume Exam Hook
export const useResumeExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: examAPI.resumeExam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['examHistory'] });
      message.success('Exam resumed successfully!');
      return data;
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to resume exam');
    },
  });
};
