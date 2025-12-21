import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UmamiConfig {
  websiteId: string | null;
  scriptUrl: string;
}

/**
 * Umami Analytics integration component.
 * 
 * Fetches Umami configuration from edge function and loads the tracking script.
 */
const UmamiAnalytics = () => {
  const location = useLocation();
  const [config, setConfig] = useState<UmamiConfig | null>(null);

  // Fetch Umami config from edge function
  useEffect(() => {
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
  }, []);

  // Load Umami script once config is available
  useEffect(() => {
    if (!config?.websiteId) {
      if (config) {
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
  }, [config]);

  // Track page views on route change
  useEffect(() => {
    if (!config?.websiteId) return;

    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track();
    }
  }, [location.pathname, config]);

  return null;
};

export default UmamiAnalytics;

// Helper function for custom event tracking
export const trackEvent = (eventName: string, eventData?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track(eventName, eventData);
  }
};
