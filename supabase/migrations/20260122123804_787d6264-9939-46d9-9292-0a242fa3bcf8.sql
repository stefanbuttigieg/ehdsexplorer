-- Create table for storing cross-regulation references
CREATE TABLE public.cross_regulation_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id INTEGER NOT NULL,
  regulation_name TEXT NOT NULL,
  regulation_short_name TEXT NOT NULL,
  provision_reference TEXT NOT NULL,
  provision_title TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'related',
  description TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_cross_regulation_article_id ON public.cross_regulation_references(article_id);
CREATE INDEX idx_cross_regulation_name ON public.cross_regulation_references(regulation_short_name);

-- Enable RLS
ALTER TABLE public.cross_regulation_references ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Cross-regulation references are viewable by everyone"
ON public.cross_regulation_references
FOR SELECT
USING (true);

-- Admin/editor write access
CREATE POLICY "Admins and editors can manage cross-regulation references"
ON public.cross_regulation_references
FOR ALL
USING (public.is_admin_or_editor(auth.uid()))
WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_cross_regulation_references_updated_at
BEFORE UPDATE ON public.cross_regulation_references
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for common cross-references
INSERT INTO public.cross_regulation_references (article_id, regulation_name, regulation_short_name, provision_reference, provision_title, relationship_type, description, url) VALUES
-- GDPR references
(1, 'General Data Protection Regulation', 'GDPR', 'Article 4', 'Definitions', 'complements', 'EHDS definitions build upon GDPR data protection definitions', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'),
(2, 'General Data Protection Regulation', 'GDPR', 'Article 6', 'Lawfulness of processing', 'relates_to', 'Legal basis for processing health data under EHDS aligns with GDPR lawfulness requirements', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'),
(2, 'General Data Protection Regulation', 'GDPR', 'Article 9', 'Processing of special categories', 'specifies', 'EHDS provides specific conditions for health data processing under GDPR Article 9', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'),
(3, 'General Data Protection Regulation', 'GDPR', 'Article 17', 'Right to erasure', 'relates_to', 'Patient rights under EHDS complement GDPR erasure rights', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'),
(5, 'General Data Protection Regulation', 'GDPR', 'Article 25', 'Data protection by design', 'implements', 'EHDS technical requirements implement GDPR data protection by design principles', 'https://eur-lex.europa.eu/eli/reg/2016/679/oj'),

-- AI Act references
(2, 'Artificial Intelligence Act', 'AI Act', 'Article 6', 'Classification rules for high-risk AI', 'relates_to', 'AI systems processing EHDS data may be classified as high-risk', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'),
(33, 'Artificial Intelligence Act', 'AI Act', 'Article 10', 'Data and data governance', 'complements', 'EHDS data quality requirements align with AI Act training data requirements', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'),
(44, 'Artificial Intelligence Act', 'AI Act', 'Annex III', 'High-risk AI systems', 'specifies', 'Health-related AI using EHDS data falls under high-risk category', 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'),

-- Medical Devices Regulation references
(33, 'Medical Devices Regulation', 'MDR', 'Article 10', 'General obligations of manufacturers', 'relates_to', 'EHDS data access supports MDR post-market surveillance obligations', 'https://eur-lex.europa.eu/eli/reg/2017/745/oj'),
(44, 'Medical Devices Regulation', 'MDR', 'Article 83', 'Post-market surveillance system', 'complements', 'EHDS enables enhanced post-market surveillance through data access', 'https://eur-lex.europa.eu/eli/reg/2017/745/oj'),

-- Data Act references
(33, 'Data Act', 'Data Act', 'Article 3', 'Obligation to make data accessible', 'aligns_with', 'EHDS secondary use provisions align with Data Act accessibility requirements', 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj'),
(35, 'Data Act', 'Data Act', 'Article 5', 'Right to share data with third parties', 'complements', 'EHDS data portability complements Data Act sharing rights', 'https://eur-lex.europa.eu/eli/reg/2023/2854/oj'),

-- Data Governance Act references
(33, 'Data Governance Act', 'DGA', 'Article 7', 'Conditions for re-use', 'specifies', 'EHDS provides sector-specific conditions for health data re-use under DGA', 'https://eur-lex.europa.eu/eli/reg/2022/868/oj'),
(44, 'Data Governance Act', 'DGA', 'Article 16', 'Data altruism organisations', 'relates_to', 'EHDS governance aligns with DGA data altruism framework', 'https://eur-lex.europa.eu/eli/reg/2022/868/oj');