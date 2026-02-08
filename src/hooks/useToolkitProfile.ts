import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ToolkitRecommendation {
  id: string;
  profile_type: string;
  organization_size: string | null;
  title: string;
  description: string;
  resource_type: string;
  resource_reference: string | null;
  priority: number;
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("toolkit-session-id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("toolkit-session-id", sid);
  }
  return sid;
}

export function useToolkitProfile() {
  const { user } = useAuth();

  const saveProfile = useMutation({
    mutationFn: async (params: {
      answers: Record<string, string | string[]>;
      profileType: string;
      organizationSize: string;
    }) => {
      const { data, error } = await supabase
        .from("toolkit_profiles")
        .insert({
          user_id: user?.id ?? null,
          session_id: user ? null : getSessionId(),
          answers: params.answers as unknown as Record<string, never>,
          profile_type: params.profileType,
          organization_size: params.organizationSize,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  return { saveProfile };
}

export function useToolkitRecommendations(
  profileType: string | null,
  organizationSize: string | null
) {
  return useQuery({
    queryKey: ["toolkit-recommendations", profileType, organizationSize],
    queryFn: async () => {
      if (!profileType) return [];

      let query = supabase
        .from("toolkit_recommendations")
        .select("*")
        .eq("profile_type", profileType)
        .eq("is_active", true)
        .order("priority");

      const { data, error } = await query;
      if (error) throw error;

      // Filter: include items matching org size OR null (universal)
      return (data ?? []).filter(
        (r) => r.organization_size === null || r.organization_size === organizationSize
      ) as ToolkitRecommendation[];
    },
    enabled: !!profileType,
  });
}
