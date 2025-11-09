import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { message } from 'antd';

// Subscription status interface
export interface SubscriptionStatus {
  active: boolean;
  type: 'free' | 'trial' | 'lite' | 'pro';
  expiresAt: string | null;
  startDate: string | null;
}

// Remaining sessions interface
export interface RemainingSessions {
  practice: number; // -1 means unlimited
  exam: number; // -1 means unlimited
}

// Get subscription status
export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: async () => {
      const response = await apiClient.get('/subscription/status');
      return response.data.data as SubscriptionStatus;
    },
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching subscription status:', error);
    },
  });
};

// Get remaining sessions
export const useRemainingSessions = () => {
  return useQuery({
    queryKey: ['remainingSessions'],
    queryFn: async () => {
      const response = await apiClient.get('/subscription/remaining-sessions');
      return response.data.data as RemainingSessions;
    },
    retry: 2,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    onError: (error: any) => {
      console.error('Error fetching remaining sessions:', error);
    },
  });
};

// Start trial
export const useStartTrial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/subscription/trial');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['remainingSessions'] });
      message.success('Trial started successfully! You have 3 days of full access.');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to start trial');
    },
  });
};

// Subscribe to Pro
export const useSubscribeToPro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/subscription/pro');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['remainingSessions'] });
      message.success('Pro subscription activated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to subscribe to Pro');
    },
  });
};

// Handle trial expiry
export const useHandleTrialExpiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (autoPayToPro: boolean) => {
      const response = await apiClient.post('/subscription/handle-trial-expiry', { autoPayToPro });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
      queryClient.invalidateQueries({ queryKey: ['remainingSessions'] });
      message.success(data.message || 'Trial expiry handled successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to handle trial expiry');
    },
  });
};

