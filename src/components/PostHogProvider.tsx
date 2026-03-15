import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_9BcUMy3kevDdo2gGu61hTnQD05dzn5FGtBxilJ6yXt3';
const POSTHOG_HOST = 'https://eu.i.posthog.com';
const COOKIE_PREFERENCES_KEY = 'ehds-cookie-preferences';

let posthogInitialized = false;

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

const initPostHog = () => {
  if (posthogInitialized) return;
  
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: false, // We handle this manually for SPA
    capture_pageleave: true,
    enable_heatmaps: true,
    enable_recording_console_log: false,
    disable_session_recording: false,
    persistence: 'localStorage+cookie',
    mask_all_text: false,
    mask_all_element_attributes: false,
  });
  
  posthogInitialized = true;
};

const PostHogProvider = () => {
  const location = useLocation();

  // Initialize or opt out based on cookie consent
  useEffect(() => {
    const hasConsent = getAnalyticsConsent();
    
    if (hasConsent) {
      initPostHog();
      posthog.opt_in_capturing();
    } else if (posthogInitialized) {
      posthog.opt_out_capturing();
    }

    // Listen for cookie preference changes
    const handleStorageChange = () => {
      const consent = getAnalyticsConsent();
      if (consent) {
        initPostHog();
        posthog.opt_in_capturing();
      } else if (posthogInitialized) {
        posthog.opt_out_capturing();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for our custom cookie settings event
    const handleCookieUpdate = () => {
      setTimeout(handleStorageChange, 100);
    };
    window.addEventListener('cookie-preferences-updated', handleCookieUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cookie-preferences-updated', handleCookieUpdate);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (posthogInitialized && getAnalyticsConsent()) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
  }, [location.pathname, location.search]);

  return null;
};

export default PostHogProvider;
