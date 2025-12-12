import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JointActionDeliverable {
  id: string;
  joint_action_name: string;
  deliverable_name: string;
  deliverable_link: string;
  related_articles: number[];
  related_implementing_acts: string[];
  created_at: string;
  updated_at: string;
}

export const useJointActionDeliverables = () => {
  return useQuery({
    queryKey: ["joint-action-deliverables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("joint_action_deliverables")
        .select("*")
        .order("joint_action_name");

      if (error) throw error;
      return data as JointActionDeliverable[];
    },
  });
};

export const useJointActionDeliverable = (id: string) => {
  return useQuery({
    queryKey: ["joint-action-deliverable", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("joint_action_deliverables")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as JointActionDeliverable | null;
    },
    enabled: !!id,
  });
};

export const getDeliverablesByArticle = (
  deliverables: JointActionDeliverable[],
  articleNumber: number
): JointActionDeliverable[] => {
  return deliverables.filter((d) => d.related_articles.includes(articleNumber));
};

export const getDeliverablesByImplementingAct = (
  deliverables: JointActionDeliverable[],
  actId: string
): JointActionDeliverable[] => {
  return deliverables.filter((d) => d.related_implementing_acts.includes(actId));
};
