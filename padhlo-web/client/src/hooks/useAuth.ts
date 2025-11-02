import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI, userAPI } from '../services/api';
import { message } from 'antd';

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      try {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        queryClient.setQueryData(['user'], data.data.user);
        message.success('Login successful!');
      } catch (error) {
        console.error('Error saving user data:', error);
        message.error('Login successful but failed to save user data');
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Login failed');
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      try {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        queryClient.setQueryData(['user'], data.data.user);
        message.success('Registration successful!');
      } catch (error) {
        console.error('Error saving user data:', error);
        message.error('Registration successful but failed to save user data');
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Registration failed');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      queryClient.clear();
      message.success('Logged out successfully');
    },
    onError: () => {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      queryClient.clear();
    },
  });
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: authAPI.getProfile,
    enabled: !!localStorage.getItem('authToken'),
    retry: false,
    initialData: () => {
      try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('user');
        return null;
      }
    },
    onError: (error: any) => {
      console.error('Error fetching user profile:', error);
      // Don't show error message as it might be due to expired token
    },
  });
};

// User Profile hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: userAPI.getProfile,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: any) => {
      console.error('Error fetching user profile:', error);
      message.error('Failed to load user profile');
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      message.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update profile');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: userAPI.changePassword,
    onSuccess: () => {
      message.success('Password changed successfully!');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to change password');
    },
  });
};

export const useUserProgress = () => {
  return useQuery({
    queryKey: ['userProgress'],
    queryFn: userAPI.getProgress,
    retry: 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      console.error('Error fetching user progress:', error);
      message.error('Failed to load user progress');
    },
  });
};

// Auth Management Hook
export const useAuthManager = () => {
  const queryClient = useQueryClient();

  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();
  const user = useUser();

  const isAuthenticated = !!user.data && !!localStorage.getItem('authToken');
  const isLoading = user.isLoading || login.isPending || register.isPending || logout.isPending;

  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    queryClient.clear();
  };

  return {
    login,
    register,
    logout,
    user,
    isAuthenticated,
    isLoading,
    clearAuth,
  };
};
