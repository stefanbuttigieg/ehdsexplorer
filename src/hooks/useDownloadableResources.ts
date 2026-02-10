import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DownloadableResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  file_url: string;
  tags: string[] | null;
  is_published: boolean | null;
  requires_email: boolean | null;
  download_count: number | null;
  thumbnail_url: string | null;
  created_at: string | null;
}

export function useDownloadableResources(tag?: string) {
  return useQuery({
    queryKey: ["downloadable-resources", tag],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downloadable_resources")
        .select("*")
        .eq("is_published", true)
        .order("title");

      if (error) throw error;

      let results = (data ?? []) as DownloadableResource[];
      if (tag) {
        results = results.filter((r) => r.tags?.includes(tag));
      }
      return results;
    },
  });
}

export async function trackDownload(resourceId: string) {
  try {
    await supabase
      .from("downloadable_resources")
      .update({ download_count: 1 } as never)
      .eq("id", resourceId);
  } catch {
    // Silently fail — not critical
  }
}
