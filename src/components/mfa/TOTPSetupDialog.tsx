import { useState } from 'react';
import { QrCode, Copy, Check, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useMFAEnrollment, TOTPEnrollment } from '@/hooks/useMFAEnrollment';

interface TOTPSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TOTPSetupDialog({ open, onOpenChange }: TOTPSetupDialogProps) {
  const { toast } = useToast();
  const { startTOTPEnrollment, verifyTOTPEnrollment, cancelEnrollment, enrollmentData } = useMFAEnrollment();
  const [step, setStep] = useState<'loading' | 'scan' | 'verify'>('loading');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [localEnrollment, setLocalEnrollment] = useState<TOTPEnrollment | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen) {
      setStep('loading');
      setVerificationCode('');
      setCopied(false);
      try {
        const data = await startTOTPEnrollment();
        setLocalEnrollment(data);
        setStep('scan');
      } catch {
        onOpenChange(false);
      }
    } else {
      cancelEnrollment();
      setLocalEnrollment(null);
    }
    onOpenChange(isOpen);
  };

  const handleCopySecret = async () => {
    if (localEnrollment?.totp.secret) {
      await navigator.clipboard.writeText(localEnrollment.totp.secret);
      setCopied(true);
      toast({ title: 'Secret copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (!localEnrollment || verificationCode.length !== 6) return;
    
    try {
      await verifyTOTPEnrollment.mutateAsync({
        factorId: localEnrollment.id,
        code: verificationCode,
      });
      onOpenChange(false);
      setLocalEnrollment(null);
    } catch {
      // Error handled in mutation
    }
  };

  const enrollment = localEnrollment || enrollmentData;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Set up Authenticator App
          </DialogTitle>
          <DialogDescription>
            {step === 'loading' && 'Generating your secure key...'}
            {step === 'scan' && 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
            {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
          </DialogDescription>
        </DialogHeader>

        {step === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {step === 'scan' && enrollment && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={enrollment.totp.qr_code} 
                  alt="QR Code for authenticator app"
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Can't scan? Enter this code manually:
            </div>
            
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                {enrollment.totp.secret}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopySecret}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === 'scan' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep('verify')}>
                Continue
              </Button>
            </>
          )}
          {step === 'verify' && (
            <>
              <Button variant="outline" onClick={() => setStep('scan')}>
                Back
              </Button>
              <Button 
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || verifyTOTPEnrollment.isPending}
              >
                {verifyTOTPEnrollment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
