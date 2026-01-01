-- Create table for QA test history
CREATE TABLE public.qa_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamp with time zone NOT NULL DEFAULT now(),
  run_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_checks integer NOT NULL,
  passed integer NOT NULL,
  failed integer NOT NULL,
  pending integer NOT NULL,
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qa_test_results ENABLE ROW LEVEL SECURITY;

-- Only admins can manage QA results
CREATE POLICY "Admins can view QA results"
ON public.qa_test_results
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can insert QA results"
ON public.qa_test_results
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete QA results"
ON public.qa_test_results
FOR DELETE
USING (is_admin_or_editor(auth.uid()));