import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UmamiConfig {
  websiteId: string | null;
  scriptUrl: string;
}

const COOKIE_PREFERENCES_KEY = 'ehds-cookie-preferences';

const getAnalyticsConsent = (): boolean => {
  try {
    const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (prefs) {
      const parsed = JSON.parse(prefs);
      return parsed.analytics === true;
    }
  } catch {
    // ignore
  }
  return false;
};

/**
 * Umami Analytics integration component.
 * 
 * Fetches Umami configuration from edge function and loads the tracking script.
 * Respects cookie consent — only loads when analytics cookies are accepted.
 */
const UmamiAnalytics = () => {
  const location = useLocation();
  const [config, setConfig] = useState<UmamiConfig | null>(null);
  const [hasConsent, setHasConsent] = useState(getAnalyticsConsent);

  // Listen for cookie preference changes
  useEffect(() => {
    const handleUpdate = () => {
      setTimeout(() => setHasConsent(getAnalyticsConsent()), 100);
    };
    window.addEventListener('cookie-preferences-updated', handleUpdate);
    window.addEventListener('storage', () => setHasConsent(getAnalyticsConsent()));
    return () => {
      window.removeEventListener('cookie-preferences-updated', handleUpdate);
      window.removeEventListener('storage', () => setHasConsent(getAnalyticsConsent()));
    };
  }, []);

  // Fetch Umami config from edge function (only when consent given)
  useEffect(() => {
    if (!hasConsent) {
      // Remove script if consent revoked
      const existingScript = document.querySelector('script[data-website-id]');
      if (existingScript) existingScript.remove();
      return;
    }

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-umami-config');
        if (error) {
          console.error('Failed to fetch Umami config:', error);
          return;
        }
        setConfig(data);
      } catch (err) {
        console.error('Error fetching Umami config:', err);
      }
    };

    fetchConfig();
  }, [hasConsent]);

  // Load Umami script once config is available and consent given
  useEffect(() => {
    if (!hasConsent || !config?.websiteId) {
      if (config && !config.websiteId) {
        console.log('Umami Analytics: No website ID configured');
      }
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[data-website-id]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = config.scriptUrl;
    script.setAttribute('data-website-id', config.websiteId);
    
    document.head.appendChild(script);

    return () => {
      const scriptElement = document.querySelector(`script[data-website-id="${config.websiteId}"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [config, hasConsent]);

  // Track page views on route change
  useEffect(() => {
    if (!hasConsent || !config?.websiteId) return;

    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track();
    }
  }, [location.pathname, config, hasConsent]);

  return null;
};

export default UmamiAnalytics;

// Helper function for custom event tracking
export const trackEvent = (eventName: string, eventData?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track(eventName, eventData);
  }
};
