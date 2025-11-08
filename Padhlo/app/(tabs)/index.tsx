
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ExamPrepApp from '../../components/ExamPrepApp';
import HomeContent from '../../components/HomeContent';
import { LoginScreen, RegisterScreen } from '../../components/AuthScreens';
import { View, StyleSheet, Alert, Text, StatusBar } from 'react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const { isAuthenticated, isLoading, login, register, logout } = useAuth();
  const [isLoginScreen, setIsLoginScreen] = useState(true);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      await register(userData);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {isLoginScreen ? (
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsLoginScreen(false)}
          />
        ) : (
          <RegisterScreen
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsLoginScreen(true)}
          />
        )}
      </View>
    );
  }

  // Wrap HomeContent with error boundary
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      <ErrorBoundary>
        <HomeContent />
      </ErrorBoundary>
    </View>
  );
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('HomeContent Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.errorHint}>
            Please restart the app or contact support
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});