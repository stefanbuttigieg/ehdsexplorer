import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useRef } from "react";

export interface CountryScore {
  country_code: string;
  country_name: string;
  total_points: number;
  reading_points: number;
  games_points: number;
  exploration_points: number;
  achievements_points: number;
  contributor_count: number;
}

// Detect user's country using free API
async function detectUserCountry(): Promise<{ code: string; name: string } | null> {
  const cached = sessionStorage.getItem("user-country");
  if (cached) return JSON.parse(cached);

  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    if (data.country_code) {
      const result = { code: data.country_code, name: data.country_name };
      sessionStorage.setItem("user-country", JSON.stringify(result));
      return result;
    }
  } catch {
    // fallback
  }
  return null;
}

export function useLeaderboard(timeRange: "all" | "month" | "week" = "all") {
  return useQuery({
    queryKey: ["leaderboard", timeRange],
    queryFn: async () => {
      let query = supabase.from("leaderboard_contributions").select("*");

      if (timeRange === "month") {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        query = query.gte("created_at", d.toISOString());
      } else if (timeRange === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("created_at", d.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by country
      const countryMap = new Map<string, CountryScore>();

      for (const row of data ?? []) {
        const key = row.country_code;
        if (!countryMap.has(key)) {
          countryMap.set(key, {
            country_code: row.country_code,
            country_name: row.country_name,
            total_points: 0,
            reading_points: 0,
            games_points: 0,
            exploration_points: 0,
            achievements_points: 0,
            contributor_count: 0,
          });
        }
        const entry = countryMap.get(key)!;
        entry.total_points += row.points;

        switch (row.category) {
          case "reading":
            entry.reading_points += row.points;
            break;
          case "games":
            entry.games_points += row.points;
            break;
          case "exploration":
            entry.exploration_points += row.points;
            break;
          case "achievements":
            entry.achievements_points += row.points;
            break;
        }
      }

      // Count unique contributors per country
      const contributorSets = new Map<string, Set<string>>();
      for (const row of data ?? []) {
        const key = row.country_code;
        if (!contributorSets.has(key)) contributorSets.set(key, new Set());
        contributorSets.get(key)!.add(row.user_id || row.session_id || "anon");
      }
      for (const [key, set] of contributorSets) {
        const entry = countryMap.get(key);
        if (entry) entry.contributor_count = set.size;
      }

      return Array.from(countryMap.values()).sort(
        (a, b) => b.total_points - a.total_points
      );
    },
    staleTime: 60_000,
  });
}

export function useTrackLeaderboard() {
  const countryRef = useRef<{ code: string; name: string } | null>(null);

  useEffect(() => {
    detectUserCountry().then((c) => {
      countryRef.current = c;
    });
  }, []);

  const track = useCallback(
    async (category: string, points = 1, sourceDetail?: string) => {
      try {
        const country = countryRef.current;
        const { data: { session } } = await supabase.auth.getSession();

        await supabase.functions.invoke("track-leaderboard", {
          body: {
            category,
            points,
            source_detail: sourceDetail,
            country_code: country?.code,
            country_name: country?.name,
          },
        });
      } catch {
        // Non-critical, fail silently
      }
    },
    []
  );

  return { track };
}
