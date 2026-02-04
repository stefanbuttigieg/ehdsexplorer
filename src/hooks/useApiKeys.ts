import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  country_codes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyWithProfile extends ApiKey {
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

// Generate a secure random API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'ehds_';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Hash using Web Crypto API (same as edge function)
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useApiKeys = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's own API keys
  const { data: myKeys = [], isLoading: myKeysLoading } = useQuery({
    queryKey: ['api-keys', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user,
  });

  // Fetch all API keys (admin only)
  const { data: allKeys = [], isLoading: allKeysLoading } = useQuery({
    queryKey: ['api-keys', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each key
      const keysWithProfiles: ApiKeyWithProfile[] = await Promise.all(
        (data || []).map(async (key) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', key.user_id)
            .maybeSingle();

          return {
            ...key,
            profile: profile || undefined,
          } as ApiKeyWithProfile;
        })
      );

      return keysWithProfiles;
    },
    enabled: !!user && (isAdmin || isSuperAdmin),
  });

  // Create a new API key
  const createKey = useMutation({
    mutationFn: async ({ name, countryCodes, expiresAt }: { 
      name: string; 
      countryCodes: string[];
      expiresAt?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12); // Store first 12 chars for identification

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          country_codes: countryCodes,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Return the raw key only once - it won't be retrievable later
      return { ...data, rawKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create API key: ' + error.message);
    },
  });

  // Revoke an API key
  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
    onError: (error: Error) => {
      toast.error('Failed to revoke API key: ' + error.message);
    },
  });

  // Delete an API key
  const deleteKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete API key: ' + error.message);
    },
  });

  return {
    myKeys,
    myKeysLoading,
    allKeys,
    allKeysLoading,
    createKey,
    revokeKey,
    deleteKey,
    isAdmin: isAdmin || isSuperAdmin,
  };
};
