-- Create enum for authority types
CREATE TYPE public.authority_type AS ENUM ('digital_health_authority', 'health_data_access_body');

-- Create enum for authority status
CREATE TYPE public.authority_status AS ENUM ('active', 'pending', 'planned', 'inactive');

-- Create the health_authorities table
CREATE TABLE public.health_authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    country_name TEXT NOT NULL,
    authority_type authority_type NOT NULL,
    status authority_status NOT NULL DEFAULT 'pending',
    
    -- Contact information
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    
    -- Extended details
    description TEXT,
    ehds_role TEXT,
    key_contacts JSONB DEFAULT '[]'::jsonb,
    related_legislation TEXT[],
    news_updates JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    logo_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.health_authorities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read health authorities"
ON public.health_authorities
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert health authorities"
ON public.health_authorities
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update health authorities"
ON public.health_authorities
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete health authorities"
ON public.health_authorities
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_health_authorities_updated_at
    BEFORE UPDATE ON public.health_authorities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster country lookups
CREATE INDEX idx_health_authorities_country ON public.health_authorities(country_code);
CREATE INDEX idx_health_authorities_type ON public.health_authorities(authority_type);
CREATE INDEX idx_health_authorities_status ON public.health_authorities(status);