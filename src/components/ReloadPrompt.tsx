import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
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
      toast.info('New version available', {
        description: 'Click reload to update to the latest version.',
        duration: Infinity,
        icon: <RefreshCw className="h-4 w-4" />,
        action: {
          label: 'Reload',
          onClick: () => {
            updateServiceWorker(true);
          },
        },
        onDismiss: () => {
          setNeedRefresh(false);
        },
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
};

export default ReloadPrompt;
