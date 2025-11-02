import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { message } from 'antd';

// User Management Hook
export const useUserManager = () => {
  const queryClient = useQueryClient();

  const invalidateUserData = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['userProgress'] });
  };

  return {
    invalidateUserData,
  };
};
