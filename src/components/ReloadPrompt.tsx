import { useCallback, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Handles PWA service worker registration and auto-updates.
 *
 * In Lovable preview / iframe contexts the SW is never registered at all
 * (see src/main.tsx guard), so this component is effectively a no-op there.
 * On the published site it keeps the aggressive auto-update + polling logic.
 */

const isPreviewEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname.includes('id-preview--') || hostname.includes('lovableproject.com');
};

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const ActiveServiceWorkerReloadPrompt = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const checkForUpdate = useCallback(async () => {
    try {
      await registrationRef.current?.update();
    } catch {
      // Silent fail – retry on next cycle
    }
  }, []);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      registrationRef.current = r ?? null;

      if (r) {
        if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
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
      if (document.visibilityState === 'visible') void checkForUpdate();
    };
    const onFocus = () => void checkForUpdate();
    const onOnline = () => void checkForUpdate();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
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

  useEffect(() => {
    if (needRefresh) void updateServiceWorker(true);
  }, [needRefresh, updateServiceWorker]);

  return null;
};

const ReloadPrompt = () => {
  // Never register a SW in preview or iframe contexts
  if (isPreviewEnvironment() || isInIframe) return null;

  return <ActiveServiceWorkerReloadPrompt />;
};

export default ReloadPrompt;
