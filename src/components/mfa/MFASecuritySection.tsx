import { useState } from 'react';
import { Shield, Smartphone, Trash2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMFAEnrollment } from '@/hooks/useMFAEnrollment';
import { useMFASettings } from '@/hooks/useMFASettings';
import { TOTPSetupDialog } from './TOTPSetupDialog';
import { EmailOTPSetup } from './EmailOTPSetup';

export function MFASecuritySection() {
  const { factors, hasMFAEnabled, hasVerifiedTOTP, unenrollFactor, isLoading } = useMFAEnrollment();
  const { settings, isEnforcementActive } = useMFASettings();
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [factorToRemove, setFactorToRemove] = useState<string | null>(null);

  const handleRemoveFactor = async () => {
    if (factorToRemove) {
      await unenrollFactor.mutateAsync(factorToRemove);
      setFactorToRemove(null);
    }
  };

  const verifiedFactors = factors?.totp?.filter(f => f.status === 'verified') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add an extra layer of security to your account by requiring a second form of verification.
        </p>
      </div>

      {isEnforcementActive && !hasMFAEnabled && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">MFA is required</p>
            <p className="text-sm text-muted-foreground">
              Your organization requires two-factor authentication. Please set up at least one method below.
            </p>
          </div>
        </div>
      )}

      {/* TOTP Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5" />
          Authenticator App
          {hasVerifiedTOTP && (
            <span className="ml-auto text-sm font-normal text-primary flex items-center gap-1">
              <Check className="h-4 w-4" />
              Enabled
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Use an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifiedFactors.length > 0 ? (
            <div className="space-y-3">
              {verifiedFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(factor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setFactorToRemove(factor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => setShowTOTPSetup(true)}>
                Add another authenticator
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowTOTPSetup(true)}>
              <Smartphone className="h-4 w-4 mr-2" />
              Set up Authenticator App
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Email OTP Section - only show if allowed */}
      {settings?.allowed_methods?.includes('email') && (
        <EmailOTPSetup />
      )}

      {/* TOTP Setup Dialog */}
      <TOTPSetupDialog open={showTOTPSetup} onOpenChange={setShowTOTPSetup} />

      {/* Remove Factor Confirmation */}
      <AlertDialog open={!!factorToRemove} onOpenChange={() => setFactorToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove authenticator?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable two-factor authentication for this method. 
              {verifiedFactors.length === 1 && !settings?.allowed_methods?.includes('email') && (
                <span className="block mt-2 font-medium text-destructive">
                  Warning: This is your only MFA method. Your account will no longer have two-factor protection.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFactor}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
