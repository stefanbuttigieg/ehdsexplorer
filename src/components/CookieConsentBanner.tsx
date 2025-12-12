import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
}

const COOKIE_CONSENT_KEY = 'ehds-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'ehds-cookie-preferences';

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  // Listen for custom event to reopen the banner
  useEffect(() => {
    const handleOpenCookieSettings = () => {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
      setShowPreferences(true);
      setIsVisible(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenCookieSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenCookieSettings);
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl">
        <Card className="shadow-lg border-border bg-background">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Cookie Settings</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPreferences(!showPreferences)}
              >
                {showPreferences ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>
              We use cookies to enhance your browsing experience, save your preferences, and analyze 
              site traffic. By clicking "Accept All", you consent to our use of cookies.{' '}
              <Link to="/cookies-policy" className="text-primary hover:underline">
                Learn more
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {showPreferences && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Essential Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Functional Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Remember your preferences like theme, font size, and bookmarks.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.functional}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, functional: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Analytics Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, analytics: checked }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              {showPreferences ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRejectNonEssential}
                  >
                    Essential Only
                  </Button>
                  <Button className="flex-1" onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPreferences(true)}
                  >
                    Customize
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRejectNonEssential}
                  >
                    Reject Non-Essential
                  </Button>
                  <Button className="flex-1" onClick={handleAcceptAll}>
                    Accept All
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              View our{' '}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/cookies-policy" className="text-primary hover:underline">
                Cookies Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
