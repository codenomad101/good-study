import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en/translation.json';
import mr from './locales/mr/translation.json';

// Language detection
const getLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('app_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'mr')) {
      return savedLanguage;
    }
    // Get device language
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    // Map device language to supported languages
    if (deviceLanguage === 'mr' || deviceLanguage.startsWith('mr')) {
      return 'mr';
    }
    return 'en';
  } catch (error) {
    console.error('[i18n] Error getting language:', error);
    return 'en';
  }
};

// Initialize i18next
export const initI18n = async () => {
  const language = await getLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: {
          translation: en,
        },
        mr: {
          translation: mr,
        },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    });

  console.log('[i18n] Initialized with language:', language);
};

// Change language function
export const changeLanguage = async (language: 'en' | 'mr') => {
  try {
    await AsyncStorage.setItem('app_language', language);
    await i18n.changeLanguage(language);
    console.log('[i18n] Language changed to:', language);
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
    throw error;
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

export default i18n;

