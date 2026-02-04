-- Create evidence type enum
CREATE TYPE public.evidence_type AS ENUM ('document', 'link', 'note');

-- Create evidence items table for country obligation statuses
CREATE TABLE public.obligation_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    obligation_id TEXT NOT NULL REFERENCES public.ehds_obligations(id) ON DELETE CASCADE,
    evidence_type public.evidence_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    -- For links
    url TEXT,
    -- For documents (stored in Supabase storage)
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    -- Metadata
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraint to ensure proper fields based on type
    CONSTRAINT evidence_type_fields CHECK (
        (evidence_type = 'link' AND url IS NOT NULL) OR
        (evidence_type = 'document' AND file_path IS NOT NULL) OR
        (evidence_type = 'note')
    )
);

-- Create index for faster lookups
CREATE INDEX idx_obligation_evidence_country_obligation 
ON public.obligation_evidence(country_code, obligation_id);

CREATE INDEX idx_obligation_evidence_uploaded_by 
ON public.obligation_evidence(uploaded_by);

-- Enable RLS
ALTER TABLE public.obligation_evidence ENABLE ROW LEVEL SECURITY;

-- Public read access for evidence
CREATE POLICY "Anyone can view obligation evidence"
ON public.obligation_evidence
FOR SELECT
USING (true);

-- Country managers can insert evidence for their assigned countries
CREATE POLICY "Country managers can add evidence for assigned countries"
ON public.obligation_evidence
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_assigned_to_country(auth.uid(), country_code)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
);

-- Country managers can update their own evidence
CREATE POLICY "Users can update their own evidence"
ON public.obligation_evidence
FOR UPDATE
TO authenticated
USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
);

-- Country managers can delete their own evidence, admins can delete any
CREATE POLICY "Users can delete their own evidence"
ON public.obligation_evidence
FOR DELETE
TO authenticated
USING (
    uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
);

-- Add updated_at trigger
CREATE TRIGGER update_obligation_evidence_updated_at
BEFORE UPDATE ON public.obligation_evidence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for evidence documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'obligation-evidence',
    'obligation-evidence',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']
);

-- Storage policies for obligation evidence
CREATE POLICY "Authenticated users can view obligation evidence files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'obligation-evidence');

CREATE POLICY "Country managers can upload evidence files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'obligation-evidence'
    AND (storage.foldername(name))[1] IN (
        SELECT country_code FROM public.user_country_assignments WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Users can delete their own evidence files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'obligation-evidence'
    AND owner = auth.uid()
);
