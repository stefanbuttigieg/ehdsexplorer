import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Info, ArrowLeft } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
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

    if (!loading && user && isEditor) {
      navigate('/admin');
    }
  }, [user, loading, isEditor, navigate]);

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
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Signed in successfully' });
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
                <CardTitle className="text-2xl font-serif">Admin Access</CardTitle>
                <CardDescription>Sign in to manage EHDS content</CardDescription>
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
                      placeholder="admin@example.com"
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
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
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
                
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                      New users are added by invitation only. If you've received an invitation email, 
                      click the link in the email to set up your account.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminAuthPage;
