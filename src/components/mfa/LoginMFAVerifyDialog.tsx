 import { useState, useEffect, useRef } from 'react';
 import { Shield, Loader2, Mail, Smartphone } from 'lucide-react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 
 interface LoginMFAVerifyDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   totpFactorId: string | null;
   emailOTPEnabled: boolean;
   userEmail: string;
   onSuccess: () => void;
   onCancel?: () => void;
 }
 
 export function LoginMFAVerifyDialog({ 
   open, 
   onOpenChange, 
   totpFactorId,
   emailOTPEnabled,
   userEmail,
   onSuccess,
   onCancel 
 }: LoginMFAVerifyDialogProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number>(0);
  const sending = useRef(false);
  const [now, setNow] = useState(Date.now());
  const storageKey = `mfa_email_sent:${userEmail}`;
  const remaining = Math.max(0, Math.ceil((lastSentAt + 30000 - now) / 1000));
  useEffect(() => {
    if (!open) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [open]);
   const [activeMethod, setActiveMethod] = useState<'totp' | 'email'>(
     totpFactorId ? 'totp' : 'email'
   );
 
    // Reset state when dialog opens
    useEffect(() => {
      if (open) {
        setCode('');
        // Restore emailCodeSent from sessionStorage (survives tab switch)
        const sentAt = Number(sessionStorage.getItem(storageKey) ?? 0);
        const wasSent = Date.now() - sentAt < 10 * 60 * 1000;
        setLastSentAt(sentAt);
        setEmailCodeSent(wasSent);
        setActiveMethod(totpFactorId ? 'totp' : 'email');
      }
    }, [open, totpFactorId, storageKey]);
 
    const handleSendEmailCode = async () => {
      // Prevent double-sends within 30 seconds
      const now = Date.now();
      if (sending.current) return;
      if (now - lastSentAt < 30000) {
        toast({
          title: 'Please wait',
          description: 'A new code can be requested every 30 seconds. Check your email for the latest code.',
        });
        return;
      }

      sending.current = true;
      setIsSendingEmail(true);
      try {
        const { data, error } = await supabase.functions.invoke('send-email-otp', {
          body: { action: 'send', purpose: 'login' },
        });

        if (error) {
          const errBody = await error?.context?.json?.().catch(() => null);
          throw new Error(errBody?.error || error.message);
        }
        if (data?.error) throw new Error(data.error);

        setEmailCodeSent(true);
        sessionStorage.setItem(storageKey, String(Date.now()));
        setLastSentAt(Date.now());
        setCode('');
        toast({
          title: 'Code sent',
          description: `A new verification code has been sent to ${userEmail}. Use the latest code only.`,
        });
      } catch (error: any) {
        console.error('Error sending email OTP:', error);
        toast({
          title: 'Failed to send code',
          description: error.message || 'Could not send verification code',
          variant: 'destructive',
        });
      } finally {
        sending.current = false;
        setIsSendingEmail(false);
      }
    };
 
   const handleVerifyTOTP = async () => {
     if (!totpFactorId || code.length !== 6 || isVerifying) return;
 
     setIsVerifying(true);
     try {
       const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
         factorId: totpFactorId,
       });
 
       if (challengeError) throw challengeError;
 
       const { error } = await supabase.auth.mfa.verify({
         factorId: totpFactorId,
         challengeId: challengeData.id,
         code,
       });
 
       if (error) throw error;
 
        sessionStorage.removeItem(storageKey);
        window.dispatchEvent(new Event('mfa-verification-changed'));
        onSuccess();
        onOpenChange(false);
     } catch (error: any) {
       toast({
         title: 'Verification failed',
         description: error.message || 'Invalid code. Please try again.',
         variant: 'destructive',
       });
     } finally {
       setIsVerifying(false);
       setCode('');
     }
   };
 
   const handleVerifyEmail = async () => {
     if (code.length !== 6 || isVerifying) return;
 
      setIsVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke('verify-email-otp-login', {
          body: { code },
        });

        if (error) {
          // Parse the actual error from the edge function response
          const errBody = await error?.context?.json?.().catch(() => null);
          throw new Error(errBody?.error || error.message);
        }
        if (data?.error) throw new Error(data.error);

        sessionStorage.removeItem(storageKey);
        window.dispatchEvent(new Event('mfa-verification-changed'));
        onSuccess();
        onOpenChange(false);
      } catch (error: any) {
        console.error('Error verifying email OTP:', error);
        const msg = error.message || 'Invalid code. Please try again.';
        toast({
          title: 'Verification failed',
          description: msg.includes('expired') 
            ? msg + ' Click "Resend code" to get a new one.'
            : msg === 'Invalid verification code'
              ? 'The code you entered doesn\'t match. Make sure you\'re using the most recent code from your email.'
              : msg,
          variant: 'destructive',
        });
      } finally {
        setIsVerifying(false);
        setCode('');
      }
   };
 
   const handleVerify = () => {
     if (activeMethod === 'totp') {
       handleVerifyTOTP();
     } else {
       handleVerifyEmail();
     }
   };
 
    const handleCancel = () => {
      sessionStorage.removeItem(storageKey);
      onCancel?.();
    };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && code.length === 6) {
       handleVerify();
     }
   };
 
   const hasBothMethods = totpFactorId && emailOTPEnabled;
 
   return (
     <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !isVerifying) handleCancel(); }}>
       <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Shield className="h-5 w-5 text-primary" />
             Two-Factor Authentication
           </DialogTitle>
           <DialogDescription>
             Verify your identity to complete sign in.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {hasBothMethods ? (
             <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as 'totp' | 'email')}>
               <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="totp" className="gap-1">
                   <Smartphone className="h-4 w-4" />
                   Authenticator
                 </TabsTrigger>
                 <TabsTrigger value="email" className="gap-1">
                   <Mail className="h-4 w-4" />
                   Email
                 </TabsTrigger>
               </TabsList>
 
               <TabsContent value="totp" className="space-y-4 mt-4">
                 <div className="space-y-2">
                   <Label htmlFor="totp-code">Verification Code</Label>
                   <Input
                     id="totp-code"
                     type="text"
                     inputMode="numeric"
                     autoComplete="one-time-code"
                     pattern="[0-9]*"
                     maxLength={6}
                     placeholder="000000"
                     value={code}
                     onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                     onKeyDown={handleKeyDown}
                     className="text-center text-2xl tracking-widest font-mono"
                     autoFocus
                     disabled={isVerifying}
                   />
                 </div>
                 <p className="text-sm text-muted-foreground text-center">
                   Enter the code from your authenticator app.
                 </p>
               </TabsContent>
 
               <TabsContent value="email" className="space-y-4 mt-4">
                 {!emailCodeSent ? (
                   <div className="text-center space-y-4">
                     <p className="text-sm text-muted-foreground">
                       We'll send a verification code to <strong>{userEmail}</strong>
                     </p>
                     <Button 
                       onClick={handleSendEmailCode} 
                       disabled={isSendingEmail || remaining > 0}
                       className="w-full"
                     >
                       {isSendingEmail ? (
                         <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           Sending...
                         </>
                       ) : (
                         <>
                           <Mail className="h-4 w-4 mr-2" />
                           Send Code
                         </>
                       )}
                     </Button>
                   </div>
                 ) : (
                   <>
                     <div className="space-y-2">
                       <Label htmlFor="email-code">Verification Code</Label>
                       <Input
                         id="email-code"
                         type="text"
                         inputMode="numeric"
                         autoComplete="one-time-code"
                     pattern="[0-9]*"
                         maxLength={6}
                         placeholder="000000"
                         value={code}
                         onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                         onKeyDown={handleKeyDown}
                         className="text-center text-2xl tracking-widest font-mono"
                         autoFocus
                         disabled={isVerifying}
                       />
                     </div>
                     <p className="text-sm text-muted-foreground text-center">
                       Enter the code sent to {userEmail}
                     </p>
                     <Button 
                       variant="link" 
                       onClick={handleSendEmailCode}
                       disabled={isSendingEmail || remaining > 0}
                       className="w-full"
                     >
                       {isSendingEmail ? 'Sending...' : remaining > 0 ? `Resend in ${remaining}s` : 'Resend code'}
                     </Button>
                   </>
                 )}
               </TabsContent>
             </Tabs>
           ) : totpFactorId ? (
             // Only TOTP
             <>
               <div className="space-y-2">
                 <Label htmlFor="mfa-code">Verification Code</Label>
                 <Input
                   id="mfa-code"
                   type="text"
                   inputMode="numeric"
                   autoComplete="one-time-code"
                     pattern="[0-9]*"
                   maxLength={6}
                   placeholder="000000"
                   value={code}
                   onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                   onKeyDown={handleKeyDown}
                   className="text-center text-2xl tracking-widest font-mono"
                   autoFocus
                   disabled={isVerifying}
                 />
               </div>
               <p className="text-sm text-muted-foreground text-center">
                 Enter the code from your authenticator app.
               </p>
             </>
           ) : (
             // Only Email OTP
             <>
               {!emailCodeSent ? (
                 <div className="text-center space-y-4">
                   <p className="text-sm text-muted-foreground">
                     We'll send a verification code to <strong>{userEmail}</strong>
                   </p>
                   <Button 
                     onClick={handleSendEmailCode} 
                     disabled={isSendingEmail || remaining > 0}
                     className="w-full"
                   >
                     {isSendingEmail ? (
                       <>
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         Sending...
                       </>
                     ) : (
                       <>
                         <Mail className="h-4 w-4 mr-2" />
                         Send Code
                       </>
                     )}
                   </Button>
                 </div>
               ) : (
                 <>
                   <div className="space-y-2">
                     <Label htmlFor="email-code-only">Verification Code</Label>
                     <Input
                       id="email-code-only"
                       type="text"
                       inputMode="numeric"
                       autoComplete="one-time-code"
                     pattern="[0-9]*"
                       maxLength={6}
                       placeholder="000000"
                       value={code}
                       onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                       onKeyDown={handleKeyDown}
                       className="text-center text-2xl tracking-widest font-mono"
                       autoFocus
                       disabled={isVerifying}
                     />
                   </div>
                   <p className="text-sm text-muted-foreground text-center">
                     Enter the code sent to {userEmail}
                   </p>
                   <Button 
                     variant="link" 
                     onClick={handleSendEmailCode}
                     disabled={isSendingEmail || remaining > 0}
                     className="w-full"
                   >
                     {isSendingEmail ? 'Sending...' : remaining > 0 ? `Resend in ${remaining}s` : 'Resend code'}
                   </Button>
                 </>
               )}
             </>
           )}
         </div>
 
         <DialogFooter className="flex-col sm:flex-row gap-2">
           <Button variant="outline" onClick={handleCancel} disabled={isVerifying}>
             Cancel
           </Button>
           {(activeMethod === 'totp' || emailCodeSent) && (
             <Button 
               onClick={handleVerify}
               disabled={code.length !== 6 || isVerifying}
             >
               {isVerifying ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Verifying...
                 </>
               ) : (
                 'Verify'
               )}
             </Button>
           )}
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }