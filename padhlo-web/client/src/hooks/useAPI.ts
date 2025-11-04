import { useMemo } from 'react';
import {
  authAPI,
  practiceAPI,
  examAPI,
  statisticsAPI,
  studyAPI,
  notesAPI,
  userAPI,
  adminAPI,
  jobsAPI,
  apiClient // Export apiClient directly for advanced use if needed
} from '../services/api';

// Re-export all hooks from specialized files for backward compatibility
export * from './useAuth';
export * from './usePractice';
export * from './useExams';
export * from './useQuestions';
export * from './useUser';
export * from './useProgress';
export * from './useAdmin';
export * from './useCategories';
export * from './useJobs';
export * from './useStatistics';

/**
 * Custom hook to access all API services.
 * Provides a convenient way to interact with various backend endpoints.
 * @returns An object containing all API service clients.
 */
export const useApi = () => {
  // Memoize the API object to prevent unnecessary re-renders
  // and ensure a stable reference across component lifecycles.
  return useMemo(() => ({
    auth: authAPI,
    practice: practiceAPI,
    exam: examAPI,
    statistics: statisticsAPI,
    study: studyAPI,
    notes: notesAPI,
    user: userAPI,
    admin: adminAPI,
    jobs: jobsAPI,
    client: apiClient, // Direct access to the configured axios instance
  }), []);
};
