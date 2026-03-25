import { useCallback, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Handles PWA service worker registration and auto-updates.
 * With registerType: "autoUpdate" + skipWaiting + clientsClaim,
 * new versions activate immediately. This component polls every
 * 60 seconds for updates and forces a page reload when one is found.
 */
const ReloadPrompt = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      await registrationRef.current?.update();
    } catch {
      // Silent fail, we'll retry on next poll/focus/online event
    }
  }, []);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      registrationRef.current = r ?? null;

      if (r) {
        // Poll for new service worker every 30 seconds
        if (pollIntervalRef.current) {
          window.clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = window.setInterval(() => {
          void checkForUpdate();
        }, 30 * 1000);
      }
    },
    onNeedRefresh() {
      void updateServiceWorker(true);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate();
      }
    };

    const onFocus = () => {
      void checkForUpdate();
    };

    const onOnline = () => {
      void checkForUpdate();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    // Run once on mount too
    void checkForUpdate();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);

      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [checkForUpdate]);

  // Auto-reload when a new version is detected
  useEffect(() => {
    if (needRefresh) {
      void updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default ReloadPrompt;
