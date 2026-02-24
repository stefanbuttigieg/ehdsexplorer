import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';

const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh],
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log('SW registered:', swUrl);
      // Check for updates every 60 seconds
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Auto-update is enabled, so the SW will activate automatically
      console.log('New version available, auto-updating...');
    }
  }, [needRefresh]);

  return null;
};

export default ReloadPrompt;
