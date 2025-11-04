import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import RootRoute from './components/RootRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Home from './pages/Home';
import Practice from './pages/Practice';
import PracticeTest from './pages/PracticeTest';
import Exams from './pages/Exams';
import Exam from './pages/Exam';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import CategoryPage from './pages/Category';
import StudyPage from './pages/Study';
import HelpPage from './pages/Help';
import NotesPage from './pages/Notes';
import PerformanceInsightsPage from './pages/PerformanceInsightsPage';
import Community from './pages/Community';
import Group from './pages/Group';
import Post from './pages/Post';
import Pricing from './pages/Pricing';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#FF7846',
            borderRadius: 8,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
        }}
      >
        <AuthProvider>
          <Router>
            <div style={{ minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/practice" 
                  element={
                    <ProtectedRoute>
                      <Practice />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/category/:slug" 
                  element={
                    <ProtectedRoute>
                      <CategoryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/practice-test/:categoryId" 
                  element={
                    <ProtectedRoute>
                      <PracticeTest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/study" 
                  element={
                    <ProtectedRoute>
                      <StudyPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/help" 
                  element={
                    <ProtectedRoute>
                      <HelpPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/exams" 
                  element={
                    <ProtectedRoute>
                      <Exams />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/exam/:sessionId" 
                  element={
                    <ProtectedRoute>
                      <Exam />
                    </ProtectedRoute>
                  } 
                />
                    <Route 
                      path="/profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <Admin />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/leaderboard" 
                      element={
                        <ProtectedRoute>
                          <Leaderboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/notes" 
                      element={
                        <ProtectedRoute>
                          <NotesPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/performance-insights" 
                      element={
                        <ProtectedRoute>
                          <PerformanceInsightsPage />
                        </ProtectedRoute>
                      } 
                    />
                     <Route 
                      path="/community" 
                      element={
                        <ProtectedRoute>
                          <Community />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/community/groups/:groupId" 
                      element={
                        <ProtectedRoute>
                          <Group />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/community/posts/:postId" 
                      element={
                        <ProtectedRoute>
                          <Post />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/pricing" 
                      element={
                        <ProtectedRoute>
                          <Pricing />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;