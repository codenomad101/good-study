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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { data: user, isLoading } = useUser();
  const logoutMutation = useLogout();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else if (!isLoading) {
      setIsAuthenticated(false);
    }
  }, [user, isLoading]);

  const logout = () => {
    logoutMutation.mutate();
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
