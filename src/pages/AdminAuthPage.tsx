import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Info, ArrowLeft, UserPlus, LogIn, Shield } from 'lucide-react';
 import { LoginMFAVerifyDialog } from '@/components/mfa/LoginMFAVerifyDialog';

const authSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

const emailSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

const AdminAuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const [mfaTotpFactorId, setMfaTotpFactorId] = useState<string | null>(null);
  const [mfaEmailEnabled, setMfaEmailEnabled] = useState(false);
  const [mfaUserEmail, setMfaUserEmail] = useState('');
  const [awaitingMFA, setAwaitingMFA] = useState(false); // Block redirects while MFA pending
  const { user, loading, signIn, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery/invite token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && (type === 'recovery' || type === 'invite' || type === 'magiclink')) {
      // User arrived via magic link/invite - redirect to set password
      navigate('/admin/set-password');
      return;
    }

    // CRITICAL: Do NOT redirect if MFA verification is in progress
    if (awaitingMFA || showMFAVerify) {
      return;
    }

    if (!loading && user) {
      // If user is an editor/admin, go to admin dashboard
      if (isEditor) {
        navigate('/admin');
      } else {
        // Regular user - redirect to home silently
        navigate('/');
      }
    }
  }, [user, loading, isEditor, navigate, toast, awaitingMFA, showMFAVerify]);

  // Also listen for auth state changes to detect invite/recovery
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        // Check if this is from an invite (user has no password set yet)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        if (type === 'invite' || type === 'recovery' || type === 'magiclink') {
          navigate('/admin/set-password');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: 'Sign In Failed',
          description: error.message === 'Invalid login credentials' 
            ? 'Invalid email or password' 
            : error.message,
          variant: 'destructive',
        });
        return;
      }

      // Check if MFA is required
      if (data.session) {
         // Check for TOTP factors
         const { data: factorsData } = await supabase.auth.mfa.listFactors();
         const verifiedTotpFactors = factorsData?.totp?.filter(f => f.status === 'verified') ?? [];
         
         // Check for Email OTP in user preferences
         const { data: mfaPrefs } = await supabase
           .from('user_mfa_preferences')
           .select('email_otp_enabled')
           .eq('user_id', data.user.id)
           .maybeSingle();
         
         const hasTotp = verifiedTotpFactors.length > 0;
         const hasEmailOtp = mfaPrefs?.email_otp_enabled === true;
         
         if (hasTotp || hasEmailOtp) {
           // User has MFA enabled - block redirects and show verification dialog
           setAwaitingMFA(true);
           setMfaTotpFactorId(hasTotp ? verifiedTotpFactors[0].id : null);
           setMfaEmailEnabled(hasEmailOtp);
           setMfaUserEmail(data.user.email || email);
          setShowMFAVerify(true);
          return;
        }
      }

      toast({ title: 'Signed in successfully' });
    } catch (err: any) {
      toast({
        title: 'Sign In Failed',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASuccess = () => {
    setShowMFAVerify(false);
    setAwaitingMFA(false); // Allow redirects now
    setMfaTotpFactorId(null);
    setMfaEmailEnabled(false);
    setMfaUserEmail('');
    toast({ title: 'Signed in successfully' });
    // Navigate after successful MFA
    if (isEditor) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleMFACancel = async () => {
    // Sign out if MFA verification is cancelled
    await supabase.auth.signOut();
    setShowMFAVerify(false);
    setAwaitingMFA(false);
    setMfaTotpFactorId(null);
    setMfaEmailEnabled(false);
    setMfaUserEmail('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'You now have read-only access. An admin can grant you editor permissions.',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/set-password`,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: 'Reset Email Sent',
        description: 'Check your email for a password reset link.',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {showForgotPassword ? (
              <>
                <div className="flex items-center mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
                <CardTitle className="text-2xl font-serif">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl font-serif">EHDS Explorer</CardTitle>
                <CardDescription>Sign in or create an account</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm">
                      We've sent a password reset link to <strong>{email}</strong>. 
                      Check your inbox and click the link to reset your password.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              )
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="signin" className="gap-1">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="gap-1">
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 h-auto text-xs"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirm Password</Label>
                        <Input
                          id="signup-confirm"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                          New accounts have read-only access. An administrator can grant you 
                          editor or admin permissions after you sign up.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>

        {/* MFA Verification Dialog */}
         <LoginMFAVerifyDialog
           open={showMFAVerify}
           onOpenChange={setShowMFAVerify}
           totpFactorId={mfaTotpFactorId}
           emailOTPEnabled={mfaEmailEnabled}
           userEmail={mfaUserEmail}
           onSuccess={handleMFASuccess}
           onCancel={handleMFACancel}
         />
      </div>
    </Layout>
  );
};

export default AdminAuthPage;
