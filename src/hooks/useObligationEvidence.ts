import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type EvidenceType = 'document' | 'link' | 'note';

export interface ObligationEvidence {
  id: string;
  country_code: string;
  obligation_id: string;
  evidence_type: EvidenceType;
  title: string;
  description: string | null;
  url: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceWithProfile extends ObligationEvidence {
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export const useObligationEvidence = (countryCode?: string, obligationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch evidence for a specific country/obligation
  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ['obligation-evidence', countryCode, obligationId],
    queryFn: async () => {
      let query = supabase
        .from('obligation_evidence')
        .select('*')
        .order('created_at', { ascending: false });

      if (countryCode) {
        query = query.eq('country_code', countryCode);
      }
      if (obligationId) {
        query = query.eq('obligation_id', obligationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch uploader profiles
      const evidenceWithProfiles: EvidenceWithProfile[] = await Promise.all(
        (data || []).map(async (item) => {
          if (item.uploaded_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('user_id', item.uploaded_by)
              .maybeSingle();
            return { ...item, profile: profile || undefined } as EvidenceWithProfile;
          }
          return item as EvidenceWithProfile;
        })
      );

      return evidenceWithProfiles;
    },
    enabled: !!(countryCode || obligationId),
  });

  // Add a link evidence
  const addLink = useMutation({
    mutationFn: async (params: {
      country_code: string;
      obligation_id: string;
      title: string;
      url: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('obligation_evidence')
        .insert({
          country_code: params.country_code,
          obligation_id: params.obligation_id,
          evidence_type: 'link' as EvidenceType,
          title: params.title,
          url: params.url,
          description: params.description || null,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-evidence'] });
      toast.success('Link added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add link: ' + error.message);
    },
  });

  // Add a note evidence
  const addNote = useMutation({
    mutationFn: async (params: {
      country_code: string;
      obligation_id: string;
      title: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('obligation_evidence')
        .insert({
          country_code: params.country_code,
          obligation_id: params.obligation_id,
          evidence_type: 'note' as EvidenceType,
          title: params.title,
          description: params.description,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-evidence'] });
      toast.success('Note added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });

  // Upload a document
  const uploadDocument = useMutation({
    mutationFn: async (params: {
      country_code: string;
      obligation_id: string;
      title: string;
      file: File;
      description?: string;
    }) => {
      const { country_code, obligation_id, title, file, description } = params;
      
      // Create unique file path: country/obligation/timestamp-filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${country_code}/${obligation_id}/${timestamp}-${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('obligation-evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create evidence record
      const { data, error } = await supabase
        .from('obligation_evidence')
        .insert({
          country_code,
          obligation_id,
          evidence_type: 'document' as EvidenceType,
          title,
          description: description || null,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-evidence'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to upload document: ' + error.message);
    },
  });

  // Delete evidence
  const deleteEvidence = useMutation({
    mutationFn: async (evidenceItem: ObligationEvidence) => {
      // If it's a document, delete from storage first
      if (evidenceItem.evidence_type === 'document' && evidenceItem.file_path) {
        const { error: storageError } = await supabase.storage
          .from('obligation-evidence')
          .remove([evidenceItem.file_path]);
        
        if (storageError) {
          console.error('Failed to delete file from storage:', storageError);
        }
      }

      // Delete the evidence record
      const { error } = await supabase
        .from('obligation_evidence')
        .delete()
        .eq('id', evidenceItem.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligation-evidence'] });
      toast.success('Evidence deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete evidence: ' + error.message);
    },
  });

  // Get signed URL for a document
  const getDocumentUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('obligation-evidence')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    evidence,
    isLoading,
    addLink,
    addNote,
    uploadDocument,
    deleteEvidence,
    getDocumentUrl,
  };
};
