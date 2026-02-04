import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

const COOKIE_CONSENT_KEY = 'ehds-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'ehds-cookie-preferences';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: false,
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  useEffect(() => {
    const handleOpenCookieSettings = () => {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
      setIsExpanded(true);
      setIsAnimating(true);
      setIsVisible(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenCookieSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenCookieSettings);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleAcceptAll = () => {
    saveConsent({ essential: true, functional: true, analytics: true });
  };

  const handleRejectNonEssential = () => {
    saveConsent({ essential: true, functional: false, analytics: false });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ease-out ${
        isMobile 
          ? 'bottom-0 left-0 right-0 p-3' 
          : 'bottom-4 left-4 max-w-sm'
      } ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Cookie className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">Cookie Settings</span>
          </div>
          
          {!isExpanded && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setIsExpanded(true)}
                aria-label="Customize cookie preferences"
              >
                Customize
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={handleAcceptAll}
              >
                Accept
              </Button>
            </div>
          )}
          
          {isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse cookie preferences"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              We use cookies to enhance your experience.{' '}
              <Link to="/cookies-policy" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>

            {/* Cookie Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Essential</Label>
                  <p className="text-[10px] text-muted-foreground">Required for the site to work</p>
                </div>
                <Switch checked disabled className="scale-75" aria-label="Essential cookies are always enabled" />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Functional</Label>
                  <p className="text-[10px] text-muted-foreground">Remember your preferences</p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, functional: checked }))
                  }
                  className="scale-75"
                  aria-label="Toggle functional cookies"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Analytics</Label>
                  <p className="text-[10px] text-muted-foreground">Help us improve the site</p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, analytics: checked }))
                  }
                  className="scale-75"
                  aria-label="Toggle analytics cookies"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleRejectNonEssential}
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleSavePreferences}
              >
                Save
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
              {' · '}
              <Link to="/cookies-policy" className="hover:underline">Cookies</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
