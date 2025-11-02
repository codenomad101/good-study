import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/LandingPage';

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading or wait for auth state to be determined
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If user is authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user is not authenticated, show landing page
  return <LandingPage />;
};

export default RootRoute;
