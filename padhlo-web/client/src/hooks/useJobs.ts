import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsAPI } from '../services/api';
import { message } from 'antd';

// Get Jobs Hook
export const useJobs = (params?: { status?: string; isActive?: boolean }) => {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => jobsAPI.getJobs(params),
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error: any) => {
      console.error('Error fetching jobs:', error);
      message.error('Failed to load jobs');
    },
  });
};

// Get Job by ID Hook
export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsAPI.getJobById(jobId),
    enabled: !!jobId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching job:', error);
      message.error('Failed to load job details');
    },
  });
};

// Get Job by Short Code Hook
export const useJobByShortCode = (shortCode: string) => {
  return useQuery({
    queryKey: ['jobByShortCode', shortCode],
    queryFn: () => jobsAPI.getJobByShortCode(shortCode),
    enabled: !!shortCode,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching job by short code:', error);
      message.error('Failed to load job details');
    },
  });
};

// Get Jobs with Stats Hook
export const useJobsWithStats = () => {
  return useQuery({
    queryKey: ['jobsWithStats'],
    queryFn: jobsAPI.getJobsWithStats,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching jobs with stats:', error);
      message.error('Failed to load jobs statistics');
    },
  });
};

// Create Job Hook
export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsAPI.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobsWithStats'] });
      message.success('Job created successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create job');
    },
  });
};

// Update Job Hook
export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, jobData }: { jobId: string; jobData: any }) =>
      jobsAPI.updateJob(jobId, jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobsWithStats'] });
      message.success('Job updated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update job');
    },
  });
};

// Delete Job Hook
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsAPI.deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobsWithStats'] });
      message.success('Job deleted successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete job');
    },
  });
};

// Jobs Management Hook
export const useJobsManager = () => {
  const queryClient = useQueryClient();

  const invalidateJobs = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobsWithStats'] });
  };

  return {
    invalidateJobs,
  };
};
