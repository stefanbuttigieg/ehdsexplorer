-- Create storage bucket for temporary PDF imports
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-pdf-imports', 'temp-pdf-imports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload temp PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-pdf-imports');

-- Public read so Firecrawl can fetch
CREATE POLICY "Public read temp PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-pdf-imports');

-- Allow uploaders to delete their own files (cleanup after import)
CREATE POLICY "Authenticated users can delete temp PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'temp-pdf-imports');