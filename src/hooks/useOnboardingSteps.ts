import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingStep {
  id: string;
  step_order: number;
  title: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useOnboardingSteps() {
  return useQuery({
    queryKey: ["onboarding-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .select("*")
        .order("step_order", { ascending: true });

      if (error) throw error;
      return data as OnboardingStep[];
    },
  });
}

export function useOnboardingStepsMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createStep = useMutation({
    mutationFn: async (step: Omit<OnboardingStep, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .insert(step)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({ title: "Onboarding step created" });
    },
    onError: (error) => {
      toast({ title: "Error creating step", description: error.message, variant: "destructive" });
    },
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OnboardingStep> & { id: string }) => {
      const { data, error } = await supabase
        .from("onboarding_steps")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({ title: "Onboarding step updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating step", description: error.message, variant: "destructive" });
    },
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("onboarding_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
      toast({ title: "Onboarding step deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting step", description: error.message, variant: "destructive" });
    },
  });

  return { createStep, updateStep, deleteStep };
}
