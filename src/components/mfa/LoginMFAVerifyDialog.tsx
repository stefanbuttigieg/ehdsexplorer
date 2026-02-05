 import { useState, useEffect } from 'react';
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
   const [activeMethod, setActiveMethod] = useState<'totp' | 'email'>(
     totpFactorId ? 'totp' : 'email'
   );
 
   // Reset state when dialog opens
   useEffect(() => {
     if (open) {
       setCode('');
       setEmailCodeSent(false);
       setActiveMethod(totpFactorId ? 'totp' : 'email');
     }
   }, [open, totpFactorId]);
 
   const handleSendEmailCode = async () => {
     setIsSendingEmail(true);
     try {
       const { data, error } = await supabase.functions.invoke('send-email-otp', {
         body: { action: 'send' },
       });
 
       if (error) throw error;
       if (data?.error) throw new Error(data.error);
 
       setEmailCodeSent(true);
       toast({
         title: 'Code sent',
         description: `A verification code has been sent to ${userEmail}`,
       });
     } catch (error: any) {
       console.error('Error sending email OTP:', error);
       toast({
         title: 'Failed to send code',
         description: error.message || 'Could not send verification code',
         variant: 'destructive',
       });
     } finally {
       setIsSendingEmail(false);
     }
   };
 
   const handleVerifyTOTP = async () => {
     if (!totpFactorId || code.length !== 6) return;
 
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
     if (code.length !== 6) return;
 
     setIsVerifying(true);
     try {
       const { data, error } = await supabase.functions.invoke('verify-email-otp-login', {
         body: { code },
       });
 
       if (error) throw error;
       if (data?.error) throw new Error(data.error);
 
       onSuccess();
       onOpenChange(false);
     } catch (error: any) {
       console.error('Error verifying email OTP:', error);
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
 
   const handleVerify = () => {
     if (activeMethod === 'totp') {
       handleVerifyTOTP();
     } else {
       handleVerifyEmail();
     }
   };
 
   const handleCancel = () => {
     onOpenChange(false);
     onCancel?.();
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && code.length === 6) {
       handleVerify();
     }
   };
 
   const hasBothMethods = totpFactorId && emailOTPEnabled;
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
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
                       disabled={isSendingEmail}
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
                       disabled={isSendingEmail}
                       className="w-full"
                     >
                       {isSendingEmail ? 'Sending...' : 'Resend code'}
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
                     disabled={isSendingEmail}
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
                     disabled={isSendingEmail}
                     className="w-full"
                   >
                     {isSendingEmail ? 'Sending...' : 'Resend code'}
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