import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NewsletterSubscription {
  id: string;
  email: string;
  name: string | null;
  source: string;
  is_verified: boolean;
  verification_token: string | null;
  verified_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadableResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  file_url: string;
  thumbnail_url: string | null;
  requires_email: boolean;
  download_count: number;
  is_published: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceDownload {
  id: string;
  resource_id: string;
  subscriber_id: string | null;
  email: string;
  downloaded_at: string;
}

// Newsletter hooks
export function useNewsletterSubscriptions() {
  return useQuery({
    queryKey: ['newsletter-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NewsletterSubscription[];
    },
  });
}

export function useNewsletterStats() {
  return useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('is_verified, unsubscribed_at');

      if (error) throw error;
      
      const total = data?.length || 0;
      const verified = data?.filter(s => s.is_verified && !s.unsubscribed_at).length || 0;
      const unverified = data?.filter(s => !s.is_verified && !s.unsubscribed_at).length || 0;
      const unsubscribed = data?.filter(s => s.unsubscribed_at).length || 0;

      return { total, verified, unverified, unsubscribed };
    },
  });
}

// Downloadable resources hooks
export function useDownloadableResources() {
  return useQuery({
    queryKey: ['downloadable-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DownloadableResource[];
    },
  });
}

export function usePublishedResources() {
  return useQuery({
    queryKey: ['published-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DownloadableResource[];
    },
  });
}

export function useResourceMutations() {
  const queryClient = useQueryClient();

  const createResource = useMutation({
    mutationFn: async (resource: Omit<DownloadableResource, 'id' | 'download_count' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .insert(resource)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['published-resources'] });
      toast.success('Resource created');
    },
    onError: (error) => {
      toast.error(`Failed to create resource: ${error.message}`);
    },
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DownloadableResource> & { id: string }) => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['published-resources'] });
      toast.success('Resource updated');
    },
    onError: (error) => {
      toast.error(`Failed to update resource: ${error.message}`);
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('downloadable_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['published-resources'] });
      toast.success('Resource deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete resource: ${error.message}`);
    },
  });

  return { createResource, updateResource, deleteResource };
}

// Resource downloads hooks
export function useResourceDownloads(resourceId?: string) {
  return useQuery({
    queryKey: ['resource-downloads', resourceId],
    queryFn: async () => {
      let query = supabase
        .from('resource_downloads')
        .select('*')
        .order('downloaded_at', { ascending: false });

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ResourceDownload[];
    },
  });
}
