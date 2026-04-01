import { useCallback, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PREVIEW_RESET_VERSION = '2';
const PREVIEW_BUSTER_PARAM = '__lovable_preview_bust__';

const getStorageKeys = (storage: Storage) =>
  Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => key !== null
  );

const shouldPreserveLocalStorageKey = (key: string) =>
  key.startsWith('sb-') || key.startsWith('supabase.');

const clearStoragePreservingAuth = () => {
  const preservedLocalEntries = getStorageKeys(localStorage)
    .filter(shouldPreserveLocalStorageKey)
    .map((key) => [key, localStorage.getItem(key)] as const)
    .filter((entry): entry is [string, string] => entry[1] !== null);

  localStorage.clear();
  preservedLocalEntries.forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  sessionStorage.clear();
};

const removePreviewBusterFromUrl = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PREVIEW_BUSTER_PARAM)) return;

  url.searchParams.delete(PREVIEW_BUSTER_PARAM);
  window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);
};

const getPreviewBustedUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.set(PREVIEW_BUSTER_PARAM, `${__BUILD_HASH__}-${Date.now()}`);
  return url.toString();
};

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
    if (typeof window === 'undefined') return;

    const resetKey = `ehds-preview-hard-reset:${PREVIEW_RESET_VERSION}:${__BUILD_HASH__}`;
    if (sessionStorage.getItem(resetKey) === 'done') {
      removePreviewBusterFromUrl();
      return;
    }

    let cancelled = false;

    const reset = async () => {
      try {
        const [registrations, cacheKeys] = await Promise.all([
          'serviceWorker' in navigator ? navigator.serviceWorker.getRegistrations() : Promise.resolve([]),
          'caches' in window ? caches.keys() : Promise.resolve([]),
        ]);

        await Promise.allSettled(
          registrations.map((registration) => registration.unregister())
        );
        await Promise.allSettled(
          cacheKeys.map((cacheKey) => caches.delete(cacheKey))
        );
      } catch {
        // Continue with a storage reset and hard refresh even if cleanup partially fails.
      }

      clearStoragePreservingAuth();
      sessionStorage.setItem(resetKey, 'done');

      if (!cancelled) {
        window.location.replace(getPreviewBustedUrl());
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
