import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

// Query Keys
export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    verify: ['auth', 'verify'] as const,
  },
  exams: {
    all: ['exams'] as const,
    detail: (id: string) => ['exams', id] as const,
    structure: (id: string) => ['exams', id, 'structure'] as const,
    subjects: (id: string) => ['exams', id, 'subjects'] as const,
    preferences: ['exams', 'preferences'] as const,
  },
  subjects: {
    topics: (id: string) => ['subjects', id, 'topics'] as const,
    questions: (id: string, limit?: number, offset?: number) => 
      ['subjects', id, 'questions', limit, offset] as const,
  },
  topics: {
    questions: (id: string, limit?: number, offset?: number) => 
      ['topics', id, 'questions', limit, offset] as const,
  },
  progress: {
    all: ['progress'] as const,
    topic: (id: string) => ['progress', 'topic', id] as const,
    stats: ['progress', 'stats'] as const,
    subjectWise: ['progress', 'subject-wise'] as const,
    weakTopics: (limit?: number) => ['progress', 'weak-topics', limit] as const,
    sessions: (startDate?: string, endDate?: string) => 
      ['progress', 'sessions', startDate, endDate] as const,
    analytics: ['progress', 'analytics'] as const,
    achievements: ['progress', 'achievements'] as const,
    challenges: ['progress', 'challenges'] as const,
  },
  tests: {
    templates: (examId?: string) => ['tests', 'templates', examId] as const,
    template: (id: string) => ['tests', 'templates', id] as const,
    userTests: (status?: string) => ['tests', 'user-tests', status] as const,
    userTest: (id: string) => ['tests', 'user-tests', id] as const,
    responses: (id: string) => ['tests', 'user-tests', id, 'responses'] as const,
    analytics: (days?: number) => ['tests', 'analytics', days] as const,
    leaderboard: (templateId: string, limit?: number) => 
      ['tests', 'leaderboard', templateId, limit] as const,
  },
};

// Auth Hooks
export const useAuthUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => apiService.getUserProfile(),
    enabled: false, // Only run when explicitly called
  });
};

export const useVerifyToken = () => {
  return useQuery({
    queryKey: queryKeys.auth.verify,
    queryFn: () => apiService.verifyToken(),
    enabled: false, // Only run when explicitly called
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ emailOrUsername, password }: { emailOrUsername: string; password: string }) =>
      apiService.login(emailOrUsername, password),
    onSuccess: (data) => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      dateOfBirth?: string;
      gender?: 'male' | 'female' | 'other';
    }) => apiService.register(userData),
    onSuccess: (data) => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileData: {
      fullName?: string;
      phone?: string;
      dateOfBirth?: string;
      gender?: 'male' | 'female' | 'other';
      profilePictureUrl?: string;
    }) => apiService.updateProfile(profileData),
    onSuccess: () => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData: {
      currentPassword: string;
      newPassword: string;
    }) => apiService.changePassword(passwordData),
  });
};

// Exam Hooks
export const useExams = () => {
  return useQuery({
    queryKey: queryKeys.exams.all,
    queryFn: () => apiService.getAllExams(),
  });
};

export const useExam = (examId: string) => {
  return useQuery({
    queryKey: queryKeys.exams.detail(examId),
    queryFn: () => apiService.getExamById(examId),
    enabled: !!examId,
  });
};

export const useExamStructure = (examId: string) => {
  return useQuery({
    queryKey: queryKeys.exams.structure(examId),
    queryFn: () => apiService.getExamStructure(examId),
    enabled: !!examId,
  });
};

export const useSubjectsByExam = (examId: string) => {
  return useQuery({
    queryKey: queryKeys.exams.subjects(examId),
    queryFn: () => apiService.getSubjectsByExam(examId),
    enabled: !!examId,
  });
};

export const useUserExamPreferences = () => {
  return useQuery({
    queryKey: queryKeys.exams.preferences,
    queryFn: () => apiService.getUserExamPreferences(),
  });
};

export const useSetExamPreference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferenceData: {
      examId: string;
      targetExamDate?: string;
      dailyStudyGoalMinutes?: number;
      isPrimaryExam?: boolean;
    }) => apiService.setUserExamPreference(preferenceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.preferences });
    },
  });
};

// Subject Hooks
export const useTopicsBySubject = (subjectId: string) => {
  return useQuery({
    queryKey: queryKeys.subjects.topics(subjectId),
    queryFn: () => apiService.getTopicsBySubject(subjectId),
    enabled: !!subjectId,
  });
};

export const useQuestionsBySubject = (
  subjectId: string, 
  limit: number = 50, 
  offset: number = 0
) => {
  return useQuery({
    queryKey: queryKeys.subjects.questions(subjectId, limit, offset),
    queryFn: () => apiService.getQuestionsBySubject(subjectId, limit, offset),
    enabled: !!subjectId,
  });
};

// Topic Hooks
export const useQuestionsByTopic = (
  topicId: string, 
  limit: number = 50, 
  offset: number = 0
) => {
  return useQuery({
    queryKey: queryKeys.topics.questions(topicId, limit, offset),
    queryFn: () => apiService.getQuestionsByTopic(topicId, limit, offset),
    enabled: !!topicId,
  });
};

// Progress Hooks
export const useUserProgress = (subjectId?: string) => {
  return useQuery({
    queryKey: [...queryKeys.progress.all, subjectId],
    queryFn: () => apiService.getUserProgress(subjectId),
  });
};

export const useTopicProgress = (topicId: string) => {
  return useQuery({
    queryKey: queryKeys.progress.topic(topicId),
    queryFn: () => apiService.getTopicProgress(topicId),
    enabled: !!topicId,
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (progressData: {
      topicId: string;
      subjectId: string;
      totalQuestionsAttempted?: number;
      correctAnswers?: number;
      totalTimeSpentSeconds?: number;
      masteryLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      masteryPercentage?: number;
      averageAccuracy?: number;
      averageTimePerQuestionSeconds?: number;
      needsRevision?: boolean;
    }) => apiService.updateProgress(progressData),
    onSuccess: (data, variables) => {
      // Invalidate progress queries
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.progress.topic(variables.topicId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.stats });
    },
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: queryKeys.progress.stats,
    queryFn: () => apiService.getUserStatistics(),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSubjectWiseProgress = () => {
  return useQuery({
    queryKey: queryKeys.progress.subjectWise,
    queryFn: async () => {
      try {
        return await apiService.getSubjectWiseProgress();
      } catch (error: any) {
        console.warn('[useApi] getSubjectWiseProgress error:', error?.message || 'Unknown error');
        // Return safe fallback
        return { success: false, data: [], message: error?.message || 'Failed to load subject progress' };
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
};

export const useWeakTopics = (limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.progress.weakTopics(limit),
    queryFn: () => apiService.getWeakTopics(limit),
  });
};

export const usePracticeSessions = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: queryKeys.progress.sessions(startDate, endDate),
    queryFn: async () => {
      try {
        return await apiService.getUserDailyPracticeSessions(7); // Use days instead of date range
      } catch (error: any) {
        console.warn('[useApi] getPracticeSessions error:', error?.message || 'Unknown error');
        return { success: false, data: [], message: error?.message || 'Failed to load practice sessions' };
      }
    },
    retry: false,
    staleTime: 2 * 60 * 1000,
    throwOnError: false,
  });
};

export const useCreatePracticeSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionData: {
      topicId: string;
      subjectId: string;
      sessionDate: string;
      sessionType?: 'daily' | 'custom' | 'revision';
      totalQuestions?: number;
      questionsAttempted?: number;
      correctAnswers?: number;
      timeSpentSeconds?: number;
      accuracyPercentage?: number;
      pointsEarned?: number;
      isCompleted?: boolean;
    }) => apiService.createProgressPracticeSession(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.sessions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.stats });
    },
  });
};

export const useAddQuestionHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (historyData: {
      questionId: string;
      userAnswer?: string;
      isCorrect?: boolean;
      timeTakenSeconds?: number;
      attemptNumber?: number;
      sourceType?: 'daily_practice' | 'test' | 'revision' | 'custom_practice';
      sourceId?: string;
    }) => apiService.addQuestionHistory(historyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.stats });
    },
  });
};

// Test Hooks
export const useTestTemplates = (examId?: string) => {
  return useQuery({
    queryKey: queryKeys.tests.templates(examId),
    queryFn: () => apiService.getAllTestTemplates(examId),
  });
};

export const useTestTemplate = (templateId: string) => {
  return useQuery({
    queryKey: queryKeys.tests.template(templateId),
    queryFn: () => apiService.getTestTemplateById(templateId),
    enabled: !!templateId,
  });
};

export const useUserTests = (status?: string) => {
  return useQuery({
    queryKey: queryKeys.tests.userTests(status),
    queryFn: () => apiService.getUserTests(status),
  });
};

export const useUserTest = (userTestId: string) => {
  return useQuery({
    queryKey: queryKeys.tests.userTest(userTestId),
    queryFn: () => apiService.getUserTestById(userTestId),
    enabled: !!userTestId,
  });
};

export const useCreateUserTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (templateId: string) => apiService.createUserTest(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.userTests() });
    },
  });
};

export const useStartUserTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userTestId: string) => apiService.startUserTest(userTestId),
    onSuccess: (data, userTestId) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tests.userTest(userTestId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.userTests() });
    },
  });
};

export const useCompleteUserTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userTestId, testData }: {
      userTestId: string;
      testData: {
        timeTakenSeconds: number;
        totalQuestionsAttempted: number;
        correctAnswers: number;
        incorrectAnswers: number;
        skippedQuestions: number;
        marksObtained: number;
        percentage: number;
        rank?: number;
        totalParticipants?: number;
        percentile?: number;
      };
    }) => apiService.completeUserTest(userTestId, testData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tests.userTest(variables.userTestId) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.userTests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tests.analytics() });
    },
  });
};

export const useSubmitTestResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (responseData: {
      userTestId: string;
      questionId: string;
      userAnswer?: string;
      isCorrect?: boolean;
      timeTakenSeconds?: number;
      isMarkedForReview?: boolean;
      responseOrder?: number;
      marksObtained?: number;
    }) => apiService.submitTestResponse(responseData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tests.responses(variables.userTestId) 
      });
    },
  });
};

export const useUserTestResponses = (userTestId: string) => {
  return useQuery({
    queryKey: queryKeys.tests.responses(userTestId),
    queryFn: () => apiService.getUserTestResponses(userTestId),
    enabled: !!userTestId,
  });
};

export const useGenerateTestQuestions = () => {
  return useMutation({
    mutationFn: ({ templateId, examId, subjectIds }: {
      templateId: string;
      examId: string;
      subjectIds?: string[];
    }) => apiService.generateTestQuestions(templateId, examId, subjectIds),
  });
};

export const useUserTestAnalytics = (days: number = 30) => {
  return useQuery({
    queryKey: queryKeys.tests.analytics(days),
    queryFn: () => apiService.getUserTestAnalytics(days),
  });
};

export const useTestLeaderboard = (templateId: string, limit: number = 100) => {
  return useQuery({
    queryKey: queryKeys.tests.leaderboard(templateId, limit),
    queryFn: () => apiService.getTestLeaderboard(templateId, limit),
    enabled: !!templateId,
  });
};

export const useUserRankInTest = (userTestId: string) => {
  return useQuery({
    queryKey: [...queryKeys.tests.userTest(userTestId), 'rank'],
    queryFn: () => apiService.getUserRankInTest(userTestId),
    enabled: !!userTestId,
  });
};

// Community Hooks
export const useGroups = () => {
  return useQuery({
    queryKey: ['community', 'groups'],
    queryFn: () => apiService.getGroups(),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });
};

export const useGroup = (groupId: string) => {
  return useQuery({
    queryKey: ['community', 'groups', groupId],
    queryFn: () => apiService.getGroup(groupId),
    enabled: !!groupId,
  });
};

export const useGroupMembers = (groupId: string) => {
  return useQuery({
    queryKey: ['community', 'groups', groupId, 'members'],
    queryFn: () => apiService.getGroupMembers(groupId),
    enabled: !!groupId,
  });
};

export const useGroupPosts = (groupId: string) => {
  return useQuery({
    queryKey: ['community', 'groups', groupId, 'posts'],
    queryFn: () => apiService.getGroupPosts(groupId),
    enabled: !!groupId,
  });
};

export const usePost = (postId: string) => {
  return useQuery({
    queryKey: ['community', 'posts', postId],
    queryFn: () => apiService.getPost(postId),
    enabled: !!postId,
  });
};

export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: ['community', 'posts', postId, 'comments'],
    queryFn: () => apiService.getPostComments(postId),
    enabled: !!postId,
  });
};

export const useJoinRequests = (groupId: string) => {
  return useQuery({
    queryKey: ['community', 'groups', groupId, 'requests'],
    queryFn: () => apiService.getJoinRequests(groupId),
    enabled: !!groupId,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      examType?: string;
      subjectId?: string;
      isPublic?: boolean;
    }) => apiService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'groups'] });
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => apiService.joinGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'groups', groupId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'groups', groupId, 'members'] });
    },
  });
};

export const useRequestToJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => apiService.requestToJoinGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'groups', groupId, 'requests'] });
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, postContent }: { groupId: string; postContent: string }) =>
      apiService.createPost(groupId, postContent),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'groups', variables.groupId, 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'groups'] });
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentContent }: { postId: string; commentContent: string }) =>
      apiService.createComment(postId, commentContent),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', variables.postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', variables.postId] });
    },
  });
};

export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => apiService.approveJoinRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
};

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, rejectionReason }: { requestId: string; rejectionReason?: string }) =>
      apiService.rejectJoinRequest(requestId, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
};

// Subscription Hooks
export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => apiService.getSubscriptionStatus(),
    retry: 1,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useStartTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.startTrial(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
};

export const useSubscribeToLite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.subscribeToLite(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
};

export const useSubscribeToPro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.subscribeToPro(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
};

export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.renewSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
};

// Legacy forum hooks (kept for backward compatibility, but not used)
export const useForums = () => {
  return useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      return { success: false, data: [], message: 'Forums not available' };
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
};

export const useForumThreads = (forumId: string) => {
  return useQuery({
    queryKey: ['forums', forumId, 'threads'],
    queryFn: async () => {
      try {
        return await apiService.get(`/community/forums/${forumId}/threads`);
      } catch (error) {
        console.warn('Forum threads endpoint not available, returning empty array');
        return { success: true, data: [] };
      }
    },
    enabled: !!forumId,
    retry: false,
  });
};

export const useForumReplies = (threadId: string) => {
  return useQuery({
    queryKey: ['threads', threadId, 'replies'],
    queryFn: async () => {
      try {
        return await apiService.get(`/community/threads/${threadId}/replies`);
      } catch (error) {
        console.warn('Forum replies endpoint not available, returning empty array');
        return { success: true, data: [] };
      }
    },
    enabled: !!threadId,
    retry: false,
  });
};

export const useStudyGroups = () => {
  return useQuery({
    queryKey: ['study-groups'],
    queryFn: async () => {
      try {
        return await apiService.get('/community/study-groups');
      } catch (error: any) {
        console.warn('[useApi] Study groups endpoint error:', {
          message: error?.message,
          endpoint: error?.endpoint || '/community/study-groups'
        });
        return { success: false, data: [], message: error?.message || 'Study groups not available' };
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
};

export const useStudyGroupMembers = (groupId: string) => {
  return useQuery({
    queryKey: ['study-groups', groupId, 'members'],
    queryFn: async () => {
      try {
        return await apiService.get(`/community/study-groups/${groupId}/members`);
      } catch (error) {
        console.warn('Study group members endpoint not available, returning empty array');
        return { success: true, data: [] };
      }
    },
    enabled: !!groupId,
    retry: false,
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { forumId: string; title: string; content: string }) => {
      try {
        return await apiService.post('/community/threads', data);
      } catch (error) {
        console.warn('Create thread endpoint not available');
        return { success: false, message: 'Feature not available' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forums'] });
    },
  });
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { threadId: string; content: string }) => {
      try {
        return await apiService.post('/community/replies', data);
      } catch (error) {
        console.warn('Create reply endpoint not available');
        return { success: false, message: 'Feature not available' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};

export const useJoinStudyGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupCode: string) => {
      try {
        return await apiService.post('/community/study-groups/join', { groupCode });
      } catch (error) {
        console.warn('Join study group endpoint not available');
        return { success: false, message: 'Feature not available' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
    },
  });
};

export const useCreateStudyGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { groupName: string; description: string; isPrivate: boolean }) => {
      try {
        return await apiService.post('/community/study-groups', data);
      } catch (error) {
        console.warn('Create study group endpoint not available');
        return { success: false, message: 'Feature not available' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
    },
  });
};

// Additional Progress Hooks
export const useUserAnalytics = (timeRange: 'week' | 'month' | 'all' = 'week') => {
  const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
  return useQuery({
    queryKey: [...queryKeys.progress.analytics, timeRange],
    queryFn: async () => {
      try {
        // Use stats endpoint instead as analytics may not exist
        return await apiService.getUserStats(days);
      } catch (error) {
        console.warn('Analytics endpoint not available, returning empty data');
        return { success: true, data: {} };
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserAchievements = () => {
  return useQuery({
    queryKey: [...queryKeys.progress.achievements],
    queryFn: async () => {
      try {
        return await apiService.get('/progress/achievements');
      } catch (error) {
        console.warn('Achievements endpoint not available, returning empty array');
        return { success: true, data: [] };
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
};

export const useDailyChallenges = () => {
  return useQuery({
    queryKey: [...queryKeys.progress.challenges],
    queryFn: async () => {
      try {
        return await apiService.get('/progress/daily-challenges');
      } catch (error) {
        console.warn('Daily challenges endpoint not available, returning empty array');
        return { success: true, data: [] };
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
};
