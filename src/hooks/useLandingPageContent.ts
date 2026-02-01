import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface CitizenRight {
  id: string;
  title: string;
  description: string;
  article_numbers: number[];
  icon: string;
  category: 'access' | 'control' | 'protection' | 'cross-border';
  sort_order: number;
  is_active: boolean;
}

export interface HealthtechCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface HealthtechItem {
  id: string;
  category_id: string;
  requirement: string;
  description: string;
  article_references: number[];
  evidence_hint: string;
  priority: 'critical' | 'high' | 'medium';
  sort_order: number;
  is_active: boolean;
}

export interface HealthcareWorkflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  scenario: string;
  key_takeaway: string;
  sort_order: number;
  is_active: boolean;
}

export interface HealthcareWorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  action: string;
  ehds_reference: string;
  article_numbers: number[];
}

export interface HealthcarePatientRight {
  id: string;
  right_name: string;
  description: string;
  article_number: number;
  practical_implication: string;
  sort_order: number;
  is_active: boolean;
}

// Citizen Rights hooks
export function useCitizenRights(activeOnly = false) {
  return useQuery({
    queryKey: ['citizen-rights', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('citizen_rights')
        .select('*')
        .order('sort_order');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CitizenRight[];
    },
  });
}

export function useCitizenRightMutations() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (right: Partial<CitizenRight> & { id: string }) => {
      const { error } = await supabase
        .from('citizen_rights')
        .upsert([right] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-rights'] });
      toast.success('Citizen right saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('citizen_rights')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citizen-rights'] });
      toast.success('Citizen right deleted');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  return { upsert, remove };
}

// Healthtech Category hooks
export function useHealthtechCategories(activeOnly = false) {
  return useQuery({
    queryKey: ['healthtech-categories', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('healthtech_compliance_categories')
        .select('*')
        .order('sort_order');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as HealthtechCategory[];
    },
  });
}

export function useHealthtechCategoryMutations() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (category: Partial<HealthtechCategory> & { id: string }) => {
      const { error } = await supabase
        .from('healthtech_compliance_categories')
        .upsert([category] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthtech-categories'] });
      toast.success('Category saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('healthtech_compliance_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthtech-categories'] });
      toast.success('Category deleted');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  return { upsert, remove };
}

// Healthtech Items hooks
export function useHealthtechItems(categoryId?: string, activeOnly = false) {
  return useQuery({
    queryKey: ['healthtech-items', categoryId, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('healthtech_compliance_items')
        .select('*')
        .order('sort_order');
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as HealthtechItem[];
    },
  });
}

export function useHealthtechItemMutations() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (item: Partial<HealthtechItem> & { id: string }) => {
      const { error } = await supabase
        .from('healthtech_compliance_items')
        .upsert([item] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthtech-items'] });
      toast.success('Compliance item saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('healthtech_compliance_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthtech-items'] });
      toast.success('Compliance item deleted');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  return { upsert, remove };
}

// Healthcare Workflow hooks
export function useHealthcareWorkflows(activeOnly = false) {
  return useQuery({
    queryKey: ['healthcare-workflows', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('healthcare_workflows')
        .select('*')
        .order('sort_order');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as HealthcareWorkflow[];
    },
  });
}

export function useHealthcareWorkflowSteps(workflowId?: string) {
  return useQuery({
    queryKey: ['healthcare-workflow-steps', workflowId],
    queryFn: async () => {
      let query = supabase
        .from('healthcare_workflow_steps')
        .select('*')
        .order('step_number');
      
      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as HealthcareWorkflowStep[];
    },
    enabled: !!workflowId || workflowId === undefined,
  });
}

export function useHealthcareWorkflowMutations() {
  const queryClient = useQueryClient();

  const upsertWorkflow = useMutation({
    mutationFn: async (workflow: Partial<HealthcareWorkflow> & { id: string }) => {
      const { error } = await supabase
        .from('healthcare_workflows')
        .upsert([workflow] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-workflows'] });
      toast.success('Workflow saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const removeWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('healthcare_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-workflows'] });
      toast.success('Workflow deleted');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const upsertStep = useMutation({
    mutationFn: async (step: Partial<HealthcareWorkflowStep> & { workflow_id: string; step_number: number }) => {
      const { error } = await supabase
        .from('healthcare_workflow_steps')
        .upsert([step] as any, { onConflict: 'workflow_id,step_number' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-workflow-steps'] });
      toast.success('Step saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const removeStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('healthcare_workflow_steps')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-workflow-steps'] });
      toast.success('Step deleted');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  return { upsertWorkflow, removeWorkflow, upsertStep, removeStep };
}

// Healthcare Patient Rights hooks
export function useHealthcarePatientRights(activeOnly = false) {
  return useQuery({
    queryKey: ['healthcare-patient-rights', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('healthcare_patient_rights')
        .select('*')
        .order('sort_order');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as HealthcarePatientRight[];
    },
  });
}

export function useHealthcarePatientRightMutations() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (right: Partial<HealthcarePatientRight>) => {
      const { error } = await supabase
        .from('healthcare_patient_rights')
        .upsert([right] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-patient-rights'] });
      toast.success('Patient right saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('healthcare_patient_rights')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-patient-rights'] });
      toast.success('Patient right deleted');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  return { upsert, remove };
}
