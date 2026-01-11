import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Language {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  sort_order: number;
}

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (code: string) => void;
  languages: Language[];
  activeLanguages: Language[];
  isLoading: boolean;
  isTranslationAvailable: (contentType: string, contentId: string | number) => Promise<boolean>;
  t: (key: string, fallback?: string) => string;
  uiTranslations: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'ehds-preferred-language';
const DEFAULT_LANGUAGE = 'en';

// Browser language detection
function detectBrowserLanguage(): string {
  const browserLang = navigator.language.split('-')[0];
  return browserLang || DEFAULT_LANGUAGE;
}

// Get language from URL path
function getLanguageFromUrl(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/([a-z]{2})(\/|$)/);
  return match ? match[1] : null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [uiTranslations, setUiTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available languages
  useEffect(() => {
    async function fetchLanguages() {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('sort_order');
      
      if (!error && data) {
        setLanguages(data);
      }
    }
    fetchLanguages();
  }, []);

  // Determine initial language
  useEffect(() => {
    async function determineLanguage() {
      setIsLoading(true);

      // Priority 1: URL-based language
      const urlLang = getLanguageFromUrl();
      if (urlLang && languages.some(l => l.code === urlLang && l.is_active)) {
        setCurrentLanguage(urlLang);
        setIsLoading(false);
        return;
      }

      // Priority 2: User preference from database (if logged in)
      if (user) {
        const { data } = await supabase
          .from('user_language_preferences')
          .select('language_code')
          .eq('user_id', user.id)
          .single();
        
        if (data?.language_code) {
          setCurrentLanguage(data.language_code);
          setIsLoading(false);
          return;
        }
      }

      // Priority 3: Local storage preference
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang && languages.some(l => l.code === storedLang && l.is_active)) {
        setCurrentLanguage(storedLang);
        setIsLoading(false);
        return;
      }

      // Priority 4: Browser language detection
      const browserLang = detectBrowserLanguage();
      if (languages.some(l => l.code === browserLang && l.is_active)) {
        setCurrentLanguage(browserLang);
      } else {
        setCurrentLanguage(DEFAULT_LANGUAGE);
      }
      
      setIsLoading(false);
    }

    if (languages.length > 0) {
      determineLanguage();
    }
  }, [user, languages]);

  // Fetch UI translations when language changes
  useEffect(() => {
    async function fetchUITranslations() {
      if (currentLanguage === 'en') {
        setUiTranslations({});
        return;
      }

      const { data } = await supabase
        .from('ui_translations')
        .select('key, value')
        .eq('language_code', currentLanguage);
      
      if (data) {
        const translations: Record<string, string> = {};
        data.forEach(item => {
          translations[item.key] = item.value;
        });
        setUiTranslations(translations);
      }
    }

    fetchUITranslations();
  }, [currentLanguage]);

  // Set language function
  const setLanguage = useCallback(async (code: string) => {
    setCurrentLanguage(code);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);

    // Save to database if user is logged in
    if (user) {
      await supabase
        .from('user_language_preferences')
        .upsert({
          user_id: user.id,
          language_code: code,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    }
  }, [user]);

  // Check if translation is available for content
  const isTranslationAvailable = useCallback(async (
    contentType: string,
    contentId: string | number
  ): Promise<boolean> => {
    if (currentLanguage === 'en') return true;

    // For now, return false for non-English as we need to check DB
    // This will be enhanced when translation tables are populated
    try {
      // Use a simple RPC or direct query approach
      // Since types aren't updated yet, we'll use a simpler check
      return false; // Will be updated when translations are added
    } catch {
      return false;
    }
  }, [currentLanguage]);

  // Translation function for UI strings
  const t = useCallback((key: string, fallback?: string): string => {
    if (currentLanguage === 'en') {
      return fallback || key;
    }
    return uiTranslations[key] || fallback || key;
  }, [currentLanguage, uiTranslations]);

  const activeLanguages = languages.filter(l => l.is_active);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        languages,
        activeLanguages,
        isLoading,
        isTranslationAvailable,
        t,
        uiTranslations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
