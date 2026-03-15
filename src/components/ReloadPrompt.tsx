import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Handles PWA service worker registration and auto-updates.
 * With registerType: "autoUpdate" + skipWaiting + clientsClaim,
 * new versions activate immediately. This component polls every
 * 60 seconds for updates and forces a page reload when one is found.
 */
const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        // Poll for new service worker every 60 seconds
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  // Auto-reload when a new version is detected
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default ReloadPrompt;
