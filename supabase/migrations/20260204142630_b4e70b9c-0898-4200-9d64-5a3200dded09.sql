-- SEO Settings table for page-level SEO management
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text UNIQUE NOT NULL,
  page_title text,
  meta_description text,
  meta_keywords text[],
  og_title text,
  og_description text,
  og_image_url text,
  twitter_card_type text DEFAULT 'summary_large_image',
  canonical_url text,
  noindex boolean DEFAULT false,
  nofollow boolean DEFAULT false,
  structured_data_type text, -- 'article', 'faq', 'howto', 'legislation'
  custom_structured_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for SEO settings
CREATE POLICY "SEO settings are publicly readable"
ON public.seo_settings FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can manage SEO settings"
ON public.seo_settings FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
);

-- Updated at trigger
CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Newsletter subscriptions table for email capture
CREATE TABLE public.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  source text DEFAULT 'website', -- 'website', 'resource_download', 'gated_content'
  is_verified boolean DEFAULT false,
  verification_token text,
  verified_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for newsletter
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- No public read (prevents email harvesting)
-- Admin can view all subscriptions
CREATE POLICY "Admins can manage newsletter subscriptions"
ON public.newsletter_subscriptions FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
);

-- Downloadable resources table
CREATE TABLE public.downloadable_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  resource_type text NOT NULL, -- 'pdf', 'checklist', 'guide', 'whitepaper'
  file_url text NOT NULL,
  thumbnail_url text,
  requires_email boolean DEFAULT true,
  download_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.downloadable_resources ENABLE ROW LEVEL SECURITY;

-- Public read for published resources
CREATE POLICY "Published resources are publicly readable"
ON public.downloadable_resources FOR SELECT
USING (is_published = true);

-- Admin write access
CREATE POLICY "Admins can manage resources"
ON public.downloadable_resources FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
);

-- Resource downloads tracking
CREATE TABLE public.resource_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.downloadable_resources(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscriptions(id) ON DELETE SET NULL,
  email text NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Admin only
CREATE POLICY "Admins can view resource downloads"
ON public.resource_downloads FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR
  public.has_role(auth.uid(), 'admin')
);

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for resources bucket
CREATE POLICY "Resources are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'resources');