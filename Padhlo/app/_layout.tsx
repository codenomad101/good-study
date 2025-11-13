import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '../contexts/AuthContext';
import { QueryProvider } from '../providers/QueryProvider';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AIChatBubble } from '../components/AIChatBubble';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Suppress console errors - show toasts instead
LogBox.ignoreLogs([
  'Registration error:',
  'Error processing response from',
  'Error calling',
  'Login error:',
  'Logout error:',
  'Token verification error:',
  'Profile update error:',
  '[API]',
  'Error fetching',
  'Error creating',
  'Error updating',
  'Error deleting',
  'Error loading',
  'Error saving',
  'Failed to',
  'Network request failed',
  'Failed to fetch',
  'Non-success status code',
  'Error response',
  'Bad Request Details',
  'JSON parse error',
  'Fetch error',
  'handleResponse error',
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="payment" options={{ presentation: 'modal', title: 'Payment', headerShown: false }} />
              </Stack>
              <AIChatBubble />
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
        <Toast />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
