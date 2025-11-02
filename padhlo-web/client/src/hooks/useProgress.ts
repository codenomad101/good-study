import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { message } from 'antd';

// Progress API functions
const progressAPI = {
  getUserProgress: async (subjectId?: string) => {
    const response = await apiClient.get('/progress/progress', { 
      params: subjectId ? { subjectId } : {} 
    });
    return response.data;
  },

  getTopicProgress: async (topicId: string) => {
    const response = await apiClient.get(`/progress/progress/topic/${topicId}`);
    return response.data;
  },

  updateProgress: async (progressData: any) => {
    const response = await apiClient.put('/progress/progress', progressData);
    return response.data;
  },

  createPracticeSession: async (sessionData: any) => {
    const response = await apiClient.post('/progress/practice-sessions', sessionData);
    return response.data;
  },

  getPracticeSessions: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/progress/practice-sessions', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  updatePracticeSession: async (sessionId: string, sessionData: any) => {
    const response = await apiClient.put(`/progress/practice-sessions/${sessionId}`, sessionData);
    return response.data;
  },

  addQuestionHistory: async (historyData: any) => {
    const response = await apiClient.post('/progress/question-history', historyData);
    return response.data;
  },

  getQuestionHistory: async (questionId?: string, limit?: number) => {
    const response = await apiClient.get('/progress/question-history', {
      params: { questionId, limit }
    });
    return response.data;
  },

  getUserStats: async (days: number = 30) => {
    const response = await apiClient.get('/progress/stats', {
      params: { days }
    });
    return response.data;
  },

  getSubjectWiseProgress: async () => {
    const response = await apiClient.get('/progress/stats/subject-wise');
    return response.data;
  },

  getWeakTopics: async (limit: number = 10) => {
    const response = await apiClient.get('/progress/stats/weak-topics', {
      params: { limit }
    });
    return response.data;
  },
};

// Get User Progress Hook
export const useUserProgressBySubject = (subjectId?: string) => {
  return useQuery({
    queryKey: ['userProgressBySubject', subjectId],
    queryFn: () => progressAPI.getUserProgress(subjectId),
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching user progress:', error);
      message.error('Failed to load user progress');
    },
  });
};

// Get Topic Progress Hook
export const useTopicProgress = (topicId: string) => {
  return useQuery({
    queryKey: ['topicProgress', topicId],
    queryFn: () => progressAPI.getTopicProgress(topicId),
    enabled: !!topicId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching topic progress:', error);
      message.error('Failed to load topic progress');
    },
  });
};

// Update Progress Hook
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: progressAPI.updateProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.invalidateQueries({ queryKey: ['topicProgress'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      message.success('Progress updated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update progress');
    },
  });
};

// Create Practice Session Hook
export const useCreateProgressPracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: progressAPI.createPracticeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceSessions'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      message.success('Practice session created successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create practice session');
    },
  });
};

// Get Practice Sessions Hook
export const usePracticeSessions = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['practiceSessions', startDate, endDate],
    queryFn: () => progressAPI.getPracticeSessions(startDate, endDate),
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    onError: (error: any) => {
      console.error('Error fetching practice sessions:', error);
      message.error('Failed to load practice sessions');
    },
  });
};

// Update Practice Session Hook
export const useUpdatePracticeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, sessionData }: { sessionId: string; sessionData: any }) =>
      progressAPI.updatePracticeSession(sessionId, sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practiceSessions'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      message.success('Practice session updated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update practice session');
    },
  });
};

// Add Question History Hook
export const useAddQuestionHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: progressAPI.addQuestionHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
    onError: (error: any) => {
      console.error('Error adding question history:', error);
      message.error('Failed to save question history');
    },
  });
};

// Get Question History Hook
export const useQuestionHistory = (questionId?: string, limit?: number) => {
  return useQuery({
    queryKey: ['questionHistory', questionId, limit],
    queryFn: () => progressAPI.getQuestionHistory(questionId, limit),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching question history:', error);
      message.error('Failed to load question history');
    },
  });
};

// Get User Stats Hook
export const useUserStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['userStats', days],
    queryFn: () => progressAPI.getUserStats(days),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching user stats:', error);
      message.error('Failed to load user statistics');
    },
  });
};

// Get Subject-wise Progress Hook
export const useSubjectWiseProgress = () => {
  return useQuery({
    queryKey: ['subjectWiseProgress'],
    queryFn: progressAPI.getSubjectWiseProgress,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error: any) => {
      console.error('Error fetching subject-wise progress:', error);
      message.error('Failed to load subject-wise progress');
    },
  });
};

// Get Weak Topics Hook
export const useWeakTopics = (limit: number = 10) => {
  return useQuery({
    queryKey: ['weakTopics', limit],
    queryFn: () => progressAPI.getWeakTopics(limit),
    retry: 2,
    staleTime: 15 * 60 * 1000, // 15 minutes
    onError: (error: any) => {
      console.error('Error fetching weak topics:', error);
      message.error('Failed to load weak topics');
    },
  });
};

// Progress Management Hook
export const useProgressManager = () => {
  const queryClient = useQueryClient();

  const updateProgress = useUpdateProgress();
  const createPracticeSession = useCreateProgressPracticeSession();
  const updatePracticeSession = useUpdatePracticeSession();
  const addQuestionHistory = useAddQuestionHistory();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    queryClient.invalidateQueries({ queryKey: ['topicProgress'] });
    queryClient.invalidateQueries({ queryKey: ['practiceSessions'] });
    queryClient.invalidateQueries({ queryKey: ['questionHistory'] });
    queryClient.invalidateQueries({ queryKey: ['userStats'] });
    queryClient.invalidateQueries({ queryKey: ['subjectWiseProgress'] });
    queryClient.invalidateQueries({ queryKey: ['weakTopics'] });
  };

  return {
    updateProgress,
    createPracticeSession,
    updatePracticeSession,
    addQuestionHistory,
    invalidateAll,
  };
};
