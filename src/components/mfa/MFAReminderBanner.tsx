import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMFAEnrollment } from '@/hooks/useMFAEnrollment';
import { useMFASettings } from '@/hooks/useMFASettings';

export function MFAReminderBanner() {
  const { user } = useAuth();
  const { shouldShowReminder, dismissReminder, snoozeReminder, hasMFAEnabled } = useMFAEnrollment();
  const { settings, isInGracePeriod, isEnforcementActive } = useMFASettings();
  const [isVisible, setIsVisible] = useState(true);

  // Don't show if user not logged in, MFA already enabled, or reminder not applicable
  if (!user || hasMFAEnabled || !shouldShowReminder || !settings?.reminder_enabled || !isVisible) {
    return null;
  }

  const handleDismiss = async () => {
    await dismissReminder();
    setIsVisible(false);
  };

  const handleSnooze = async () => {
    await snoozeReminder();
    setIsVisible(false);
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Secure your account with two-factor authentication.</span>
              {isInGracePeriod && settings?.grace_period_end_date && (
                <span className="text-muted-foreground ml-1">
                  (Required by {new Date(settings.grace_period_end_date).toLocaleDateString()})
                </span>
              )}
              {isEnforcementActive && (
                <span className="text-destructive ml-1 font-medium">
                  MFA is now required for all users.
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile?tab=security">
              <Button size="sm" variant="default">
                Set up now
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSnooze}
              className="text-muted-foreground"
            >
              <Clock className="h-4 w-4 mr-1" />
              Remind later
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
