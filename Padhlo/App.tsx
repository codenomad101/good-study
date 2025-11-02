import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ExamPrepApp from './components/ExamPrepApp';
import { LoginScreen, RegisterScreen } from './components/AuthScreens';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login, register, logout } = useAuth();
  const [isLoginScreen, setIsLoginScreen] = useState(true);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      throw error; // Re-throw to be handled by LoginScreen
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      await register(userData);
    } catch (error) {
      throw error; // Re-throw to be handled by RegisterScreen
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
        {/* You can add a loading spinner here */}
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
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

  return <ExamPrepApp onLogout={handleLogout} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

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
});

export default App;




