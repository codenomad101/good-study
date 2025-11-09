import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLogin, useRegister, useUpdateProfile, useVerifyToken } from '../hooks/useApi';
import { apiService } from '../services/api';

interface User {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  role?: 'admin' | 'student' | 'moderator';
  subscriptionType: 'free' | 'premium' | 'premium_plus';
  totalPoints: number;
  level: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTimeMinutes: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
  }) => Promise<void>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<void>;
  updateProfile: (profileData: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profilePictureUrl?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // React Query hooks
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const updateProfileMutation = useUpdateProfile();
  const verifyTokenQuery = useVerifyToken();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify token is still valid
        await verifyToken();
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading stored auth:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);

      // Real API call using React Query
      const result = await loginMutation.mutateAsync({ emailOrUsername, password });
      
      if (result.success && result.data) {
        const { user: userData, token: authToken } = result.data;
        
        // Store auth data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        setUser(userData);
        setToken(authToken);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Login error:', error);
      }
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
  }) => {
    try {
      setIsLoading(true);

      // Real API call using React Query
      const result = await registerMutation.mutateAsync(userData);
      
      if (result.success && result.data) {
        const { user: newUser, token: authToken } = result.data;
        
        // Store auth data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('userData', JSON.stringify(newUser));
        
        setUser(newUser);
        setToken(authToken);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      // Don't log to console in production to avoid error notifications
      // Error is already handled in the component with toast
      if (__DEV__) {
        console.error('Registration error:', error);
      }
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout API if token exists
      if (token) {
        try {
          await apiService.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          if (__DEV__) {
            console.error('Logout API error:', error);
          }
        }
      }
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setToken(null);
    } catch (error) {
      if (__DEV__) {
        console.error('Logout error:', error);
      }
    }
  };

  const verifyToken = async () => {
    if (!token) return;

    try {
      // Real API call using React Query
      const result = await verifyTokenQuery.refetch();
      
      if (result.data?.success && result.data?.data) {
        setUser(result.data.data.user);
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Token verification error:', error);
      }
      // Token is invalid, clear auth data
      await logout();
    }
  };

  const updateProfile = async (profileData: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profilePictureUrl?: string;
  }) => {
    try {
      const result = await updateProfileMutation.mutateAsync(profileData);
      
      if (result.success && result.data) {
        const updatedUser = result.data.user;
        
        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        throw new Error(result.message || 'Profile update failed');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Profile update error:', error);
      }
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    verifyToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};