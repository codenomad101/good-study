import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useLogout } from '../hooks/useAPI';

interface User {
  userId: string;
  username?: string;
  email: string;
  fullName: string;
  role: 'admin' | 'student' | 'moderator';
  phone?: string;
  profilePictureUrl?: string;
  subscriptionType: 'free' | 'premium' | 'premium_plus';
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize auth state from localStorage immediately (synchronously)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage synchronously on initial render
    const token = localStorage.getItem('authToken');
    return !!token;
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const { data: user, isLoading, error } = useUser();
  const logoutMutation = useLogout();

  // Mark initialization as complete once useUser has finished its initial check
  // This ensures we don't redirect during the initial auth state determination
  useEffect(() => {
    // Wait for useUser to complete its initial load
    // If we have a token, keep isAuthenticated true even if API call is still loading
    if (!isLoading) {
      // useUser has finished loading (either success or error)
      setIsInitializing(false);
    }
  }, [isLoading]);

  // Update auth state based on user data, but don't clear on network errors
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
      // Update stored user if it changed
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch (e) {
        console.error('Error saving user to localStorage:', e);
      }
    } else if (!isLoading && error) {
      // Only clear auth if it's an actual auth error (401), not a network error
      const errorMessage = error?.message || '';
      const isAuthError = errorMessage.includes('401') || 
                         errorMessage.includes('Unauthorized') ||
                         (error as any)?.response?.status === 401;
      
      if (isAuthError && !errorMessage.includes('Network') && !errorMessage.includes('fetch')) {
        // Token is invalid, clear auth
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } else {
        // Network error - keep existing auth state
        const token = localStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true);
        }
      }
    } else if (!isLoading && !error && !user) {
      // No error, no user, and not loading - check if we have a token
      // If we have a token, keep authenticated state (might be network issue)
      // Only set to false if we truly don't have a token
      const token = localStorage.getItem('authToken');
      if (token) {
        // We have a token but no user data - might be network issue
        // Keep authenticated state to prevent redirects
        setIsAuthenticated(true);
      } else {
        // No token, definitely not authenticated
        setIsAuthenticated(false);
      }
    }
  }, [user, isLoading, error]);

  const logout = () => {
    logoutMutation.mutate();
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Combine initializing state with loading state
  // During initial load, we want to show loading to prevent redirects
  const combinedIsLoading = isInitializing || isLoading;

  const value: AuthContextType = {
    user: user || null,
    isLoading: combinedIsLoading,
    isAuthenticated,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
