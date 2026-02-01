-- Topic Index Table for mapping topics/rights/obligations to EHDS articles
-- Enables admin-editable topic-to-article mappings displayed on stakeholder landing pages

CREATE TABLE public.topic_article_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_type TEXT NOT NULL CHECK (stakeholder_type IN ('citizen', 'healthtech', 'healthcare_professional', 'researcher', 'policy_maker')),
  category TEXT NOT NULL,
  topic TEXT NOT NULL,
  description TEXT,
  article_numbers INTEGER[] NOT NULL DEFAULT '{}',
  recital_numbers INTEGER[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topic_article_index ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can read topic index" 
ON public.topic_article_index 
FOR SELECT 
USING (is_active = true);

-- Admin write policies
CREATE POLICY "Admins can insert topic index" 
ON public.topic_article_index 
FOR INSERT 
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update topic index" 
ON public.topic_article_index 
FOR UPDATE 
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete topic index" 
ON public.topic_article_index 
FOR DELETE 
USING (is_admin_or_editor(auth.uid()));

-- Index for efficient filtering by stakeholder type
CREATE INDEX idx_topic_article_index_stakeholder ON public.topic_article_index(stakeholder_type);

-- Trigger for updated_at
CREATE TRIGGER update_topic_article_index_updated_at
  BEFORE UPDATE ON public.topic_article_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial data for Citizens
INSERT INTO public.topic_article_index (stakeholder_type, category, topic, description, article_numbers, recital_numbers, sort_order) VALUES
-- Access Rights
('citizen', 'Access Rights', 'Access your health records', 'Right to view your electronic health data including diagnoses, prescriptions, and test results', ARRAY[3, 7], ARRAY[7, 8], 1),
('citizen', 'Access Rights', 'Download your data', 'Receive your health data in electronic format, free of charge', ARRAY[3, 5], ARRAY[9, 10], 2),
('citizen', 'Access Rights', 'Data portability', 'Transfer your health data to another healthcare provider in the EU', ARRAY[5], ARRAY[11], 3),
-- Control Rights
('citizen', 'Control Rights', 'Request corrections', 'Ask healthcare providers to correct inaccurate personal health data', ARRAY[4], ARRAY[12], 4),
('citizen', 'Control Rights', 'Restrict access', 'Limit which healthcare professionals can see certain parts of your records', ARRAY[9], ARRAY[13, 14], 5),
('citizen', 'Control Rights', 'View access logs', 'See who has accessed your electronic health records and when', ARRAY[12], ARRAY[15], 6),
-- Protection Rights
('citizen', 'Protection Rights', 'Opt out of secondary use', 'Withdraw consent for your health data to be used for research', ARRAY[51], ARRAY[42, 43], 7),
('citizen', 'Protection Rights', 'File complaints', 'Lodge complaints with your national digital health authority', ARRAY[19, 20], ARRAY[21], 8),
-- Cross-border Rights
('citizen', 'Cross-Border Rights', 'Access care abroad', 'Have your health data available when receiving healthcare in other EU countries', ARRAY[15, 16, 17], ARRAY[18, 19], 9),
('citizen', 'Cross-Border Rights', 'Use prescriptions abroad', 'Have electronic prescriptions recognized in other EU member states', ARRAY[17], ARRAY[20], 10);

-- Seed initial data for Health Tech
INSERT INTO public.topic_article_index (stakeholder_type, category, topic, description, article_numbers, recital_numbers, sort_order) VALUES
-- EHR System Requirements
('healthtech', 'EHR System Requirements', 'Essential requirements', 'Meet the essential requirements set out in Annex II', ARRAY[6], ARRAY[24, 25], 1),
('healthtech', 'EHR System Requirements', 'CE marking', 'Affix the CE marking to indicate conformity', ARRAY[27], ARRAY[28], 2),
('healthtech', 'EHR System Requirements', 'EU declaration of conformity', 'Draw up an EU declaration of conformity', ARRAY[26], ARRAY[27], 3),
('healthtech', 'EHR System Requirements', 'Technical documentation', 'Prepare technical documentation as specified in Annex III', ARRAY[24], ARRAY[26], 4),
-- Interoperability
('healthtech', 'Interoperability', 'European EHR exchange format', 'Ensure interoperability with the European electronic health record exchange format', ARRAY[6, 14], ARRAY[16, 17], 5),
('healthtech', 'Interoperability', 'Logging capabilities', 'Implement logging mechanisms to record access to electronic health data', ARRAY[6], ARRAY[15], 6),
-- Market Obligations
('healthtech', 'Market Obligations', 'Manufacturer obligations', 'Core requirements for EHR system manufacturers', ARRAY[17, 20], ARRAY[22], 7),
('healthtech', 'Market Obligations', 'Authorised representative', 'Manufacturers outside EU must designate an EU representative', ARRAY[21], ARRAY[23], 8),
('healthtech', 'Market Obligations', 'Importer obligations', 'Requirements for importers of EHR systems', ARRAY[22], ARRAY[23], 9),
('healthtech', 'Market Obligations', 'Distributor obligations', 'Requirements for distributors of EHR systems', ARRAY[23], ARRAY[23], 10),
-- Secondary Use
('healthtech', 'Secondary Use Infrastructure', 'Health data access bodies', 'Requirements for health data access bodies', ARRAY[36], ARRAY[35, 36], 11),
('healthtech', 'Secondary Use Infrastructure', 'Data permits', 'Process for obtaining data permits for secondary use', ARRAY[46], ARRAY[44, 45], 12),
('healthtech', 'Secondary Use Infrastructure', 'Secure processing environment', 'Requirements for secure processing environments', ARRAY[50], ARRAY[48], 13);

-- Seed initial data for Healthcare Professionals
INSERT INTO public.topic_article_index (stakeholder_type, category, topic, description, article_numbers, recital_numbers, sort_order) VALUES
-- Patient Data Management
('healthcare_professional', 'Patient Data Management', 'Priority categories of data', 'Categories of electronic health data that must be prioritized', ARRAY[7], ARRAY[8, 9], 1),
('healthcare_professional', 'Patient Data Management', 'Data registration', 'Requirements for registering electronic health data', ARRAY[8], ARRAY[10], 2),
('healthcare_professional', 'Patient Data Management', 'Access to patient data', 'When and how healthcare professionals can access patient data', ARRAY[10], ARRAY[11, 12], 3),
-- Patient Rights Support
('healthcare_professional', 'Patient Rights Support', 'Responding to access requests', 'How to handle patient requests to access their data', ARRAY[3, 7], ARRAY[7, 8], 4),
('healthcare_professional', 'Patient Rights Support', 'Correcting patient data', 'Process for correcting inaccurate health data', ARRAY[4], ARRAY[12], 5),
('healthcare_professional', 'Patient Rights Support', 'Access restrictions', 'Managing patient-imposed access restrictions', ARRAY[9], ARRAY[13, 14], 6),
-- Cross-border Care
('healthcare_professional', 'Cross-Border Care', 'MyHealth@EU infrastructure', 'Using the MyHealth@EU infrastructure for cross-border care', ARRAY[15, 16], ARRAY[18, 19], 7),
('healthcare_professional', 'Cross-Border Care', 'Cross-border prescriptions', 'Handling electronic prescriptions from other EU countries', ARRAY[17], ARRAY[20], 8),
-- Authentication & Access
('healthcare_professional', 'Authentication & Access', 'Healthcare professional identification', 'Requirements for identifying and authenticating healthcare professionals', ARRAY[11], ARRAY[14], 9),
('healthcare_professional', 'Authentication & Access', 'Access logging', 'Logging access to electronic health records', ARRAY[12], ARRAY[15], 10);