import { useCallback, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Handles PWA service worker registration and auto-updates in production-like
 * environments, while actively disabling stale SW state in Lovable preview.
 */
const isPreviewEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname.includes('id-preview--') || hostname.includes('lovableproject.com');
};

const PreviewServiceWorkerReset = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const resetKey = `ehds-preview-sw-reset:${__BUILD_HASH__}`;
    if (sessionStorage.getItem(resetKey) === 'done') return;

    let cancelled = false;

    const reset = async () => {
      try {
        const [registrations, cacheKeys] = await Promise.all([
          navigator.serviceWorker.getRegistrations(),
          caches.keys(),
        ]);

        const unregisterResults = await Promise.allSettled(
          registrations.map((registration) => registration.unregister())
        );
        const cacheDeleteResults = await Promise.allSettled(
          cacheKeys.map((cacheKey) => caches.delete(cacheKey))
        );

        const hadRegistrations = unregisterResults.some(
          (result) => result.status === 'fulfilled' && result.value
        );
        const hadCaches = cacheDeleteResults.some(
          (result) => result.status === 'fulfilled' && result.value
        );

        sessionStorage.setItem(resetKey, 'done');

        if (!cancelled && (hadRegistrations || hadCaches)) {
          window.location.reload();
        }
      } catch {
        sessionStorage.setItem(resetKey, 'done');
      }
    };

    void reset();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

const ActiveServiceWorkerReloadPrompt = () => {
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

const ReloadPrompt = () => {
  if (isPreviewEnvironment()) {
    return <PreviewServiceWorkerReset />;
  }

  return <ActiveServiceWorkerReloadPrompt />;
};

export default ReloadPrompt;
