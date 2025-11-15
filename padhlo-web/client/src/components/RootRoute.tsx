import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/LandingPage';

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading or wait for auth state to be determined
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // RootRoute should ONLY handle the root path '/'
  // This component is only rendered when path="/", so we should always be on '/'
  // But as a safety check, if we're somehow not on '/', don't interfere
  if (location.pathname !== '/') {
    // This should never happen, but if it does, return null
    // This will cause React Router to not match this route and continue matching
    return null;
  }
  
  // If user is authenticated and on root, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user is not authenticated, show landing page
  return <LandingPage />;
};

export default RootRoute;
