import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UmamiAnalyticsProps {
  websiteId?: string;
  scriptUrl?: string;
}

/**
 * Umami Analytics integration component.
 * 
 * To use this:
 * 1. Set up Umami (self-hosted or cloud at https://cloud.umami.is)
 * 2. Create a website in Umami and get your Website ID
 * 3. Set VITE_UMAMI_WEBSITE_ID in your environment
 * 4. Optionally set VITE_UMAMI_SCRIPT_URL if self-hosting
 * 
 * Default script URL points to Umami Cloud.
 */
const UmamiAnalytics = ({ 
  websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID,
  scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js'
}: UmamiAnalyticsProps) => {
  const location = useLocation();

  // Load Umami script
  useEffect(() => {
    if (!websiteId) {
      console.log('Umami Analytics: No website ID configured');
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[data-website-id]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = scriptUrl;
    script.setAttribute('data-website-id', websiteId);
    
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (rarely needed for analytics)
      const scriptElement = document.querySelector(`script[data-website-id="${websiteId}"]`);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [websiteId, scriptUrl]);

  // Track page views on route change (Umami does this automatically, but this ensures SPA navigation is tracked)
  useEffect(() => {
    if (!websiteId) return;

    // Umami automatically tracks page views when the script loads
    // For SPAs, we can optionally trigger manual tracking
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track();
    }
  }, [location.pathname, websiteId]);

  return null;
};

export default UmamiAnalytics;

// Helper function for custom event tracking
export const trackEvent = (eventName: string, eventData?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track(eventName, eventData);
  }
};
