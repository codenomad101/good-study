import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initI18n, changeLanguage, getCurrentLanguage } from '../i18n';

interface LanguageContextType {
  language: string;
  changeLang: (lang: 'en' | 'mr') => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        setIsLoading(true);
        await initI18n();
        const currentLang = getCurrentLanguage();
        setLanguage(currentLang);
      } catch (error) {
        console.error('[LanguageContext] Error initializing i18n:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const changeLang = async (lang: 'en' | 'mr') => {
    try {
      await changeLanguage(lang);
      setLanguage(lang);
    } catch (error) {
      console.error('[LanguageContext] Error changing language:', error);
      throw error;
    }
  };

  const value: LanguageContextType = {
    language,
    changeLang,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

