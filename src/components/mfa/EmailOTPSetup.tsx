import { useState } from 'react';
import { Mail, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMFAEnrollment } from '@/hooks/useMFAEnrollment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function EmailOTPSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences, updatePreferences } = useMFAEnrollment();
  const [step, setStep] = useState<'idle' | 'sending' | 'verifying' | 'verified'>('idle');
  const [code, setCode] = useState('');

  const isEnabled = preferences?.email_otp_enabled ?? false;

  const handleSendCode = async () => {
    if (!user?.email) return;

    setStep('sending');
    try {
      // Use Supabase's email OTP flow
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setStep('verifying');
      toast({
        title: 'Code sent',
        description: `A verification code has been sent to ${user.email}`,
      });
    } catch (error: any) {
      setStep('idle');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async () => {
    if (!user?.email || code.length !== 6) return;

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: code,
        type: 'email',
      });

      if (error) throw error;

      await updatePreferences.mutateAsync({ email_otp_enabled: true });
      setStep('verified');
      toast({
        title: 'Email OTP enabled',
        description: 'You can now use email verification for two-factor authentication.',
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDisable = async () => {
    try {
      await updatePreferences.mutateAsync({ email_otp_enabled: false });
      setStep('idle');
      toast({
        title: 'Email OTP disabled',
        description: 'Email verification has been disabled.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          Email Verification
          {isEnabled && (
            <span className="ml-auto text-sm font-normal text-primary flex items-center gap-1">
              <Check className="h-4 w-4" />
              Enabled
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Receive a one-time code via email when signing in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Email verification is currently enabled for your account. 
              A code will be sent to <strong>{user?.email}</strong> when you sign in.
            </p>
            <Button variant="outline" onClick={handleDisable}>
              Disable Email OTP
            </Button>
          </div>
        ) : (
          <>
            {step === 'idle' && (
              <Button onClick={handleSendCode}>
                <Mail className="h-4 w-4 mr-2" />
                Enable Email Verification
              </Button>
            )}

            {step === 'sending' && (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending code...
              </Button>
            )}

            {step === 'verifying' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to <strong>{user?.email}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email-otp-code">Verification Code</Label>
                  <Input
                    id="email-otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="max-w-[200px] text-center text-xl tracking-widest font-mono"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('idle')}>
                    Cancel
                  </Button>
                  <Button onClick={handleVerify} disabled={code.length !== 6}>
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}

            {step === 'verified' && (
              <div className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                <span>Email verification enabled successfully!</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
