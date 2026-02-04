import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface TOTPEnrollment {
  id: string;
  type: 'totp';
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export interface MFAFactor {
  id: string;
  friendly_name: string | null;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

export interface UserMFAPreferences {
  id: string;
  user_id: string;
  reminder_dismissed_at: string | null;
  reminder_snooze_until: string | null;
  preferred_method: string;
  email_otp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useMFAEnrollment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enrollmentData, setEnrollmentData] = useState<TOTPEnrollment | null>(null);

  // Fetch user's MFA factors from Supabase Auth
  const { data: factors, isLoading: factorsLoading, refetch: refetchFactors } = useQuery({
    queryKey: ['mfa-factors', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's MFA preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ['mfa-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_mfa_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserMFAPreferences | null;
    },
    enabled: !!user,
  });

  // Start TOTP enrollment
  const startTOTPEnrollment = useCallback(async (friendlyName?: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName || 'Authenticator App',
      });

      if (error) throw error;
      setEnrollmentData(data as TOTPEnrollment);
      return data as TOTPEnrollment;
    } catch (error: any) {
      toast({
        title: 'Enrollment failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Verify TOTP enrollment with code
  const verifyTOTPEnrollment = useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      // First create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Then verify the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setEnrollmentData(null);
      refetchFactors();
      toast({
        title: 'MFA enabled',
        description: 'Two-factor authentication is now active on your account.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Unenroll a factor
  const unenrollFactor = useMutation({
    mutationFn: async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchFactors();
      toast({
        title: 'MFA disabled',
        description: 'Two-factor authentication has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update user MFA preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserMFAPreferences>) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_mfa_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-preferences', user?.id] });
    },
  });

  // Dismiss reminder
  const dismissReminder = useCallback(async () => {
    await updatePreferences.mutateAsync({
      reminder_dismissed_at: new Date().toISOString(),
    });
  }, [updatePreferences]);

  // Snooze reminder for 7 days
  const snoozeReminder = useCallback(async () => {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7);
    await updatePreferences.mutateAsync({
      reminder_snooze_until: snoozeUntil.toISOString(),
    });
  }, [updatePreferences]);

  // Cancel enrollment
  const cancelEnrollment = useCallback(() => {
    setEnrollmentData(null);
  }, []);

  // Check if TOTP is verified
  const hasVerifiedTOTP = factors?.totp?.some(f => f.status === 'verified') ?? false;
  
  // Check if any MFA is enabled
  const hasMFAEnabled = hasVerifiedTOTP || (preferences?.email_otp_enabled ?? false);

  // Check if reminder should be shown
  const shouldShowReminder = !hasMFAEnabled && 
    !preferences?.reminder_dismissed_at &&
    (!preferences?.reminder_snooze_until || new Date(preferences.reminder_snooze_until) < new Date());

  return {
    factors,
    preferences,
    isLoading: factorsLoading || preferencesLoading,
    enrollmentData,
    startTOTPEnrollment,
    verifyTOTPEnrollment,
    unenrollFactor,
    updatePreferences,
    dismissReminder,
    snoozeReminder,
    cancelEnrollment,
    hasVerifiedTOTP,
    hasMFAEnabled,
    shouldShowReminder,
    refetchFactors,
  };
}
