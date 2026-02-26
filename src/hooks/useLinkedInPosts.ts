import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LinkedInPost {
  id: string;
  implementing_act_id: string;
  post_url: string;
  title: string;
  description: string | null;
  author_name: string | null;
  posted_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useLinkedInPosts = (implementingActId: string) => {
  return useQuery({
    queryKey: ["linkedin-posts", implementingActId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_linkedin_posts")
        .select("*")
        .eq("implementing_act_id", implementingActId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LinkedInPost[];
    },
    enabled: !!implementingActId,
  });
};

export const useCreateLinkedInPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: Omit<LinkedInPost, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("implementing_act_linkedin_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts", variables.implementing_act_id] });
    },
  });
};

export const useDeleteLinkedInPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, implementingActId }: { id: string; implementingActId: string }) => {
      const { error } = await supabase
        .from("implementing_act_linkedin_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts", variables.implementingActId] });
    },
  });
};
