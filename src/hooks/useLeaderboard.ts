import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface CountryScore {
  country_code: string;
  country_name: string;
  total_points: number;
  reading_points: number;
  games_points: number;
  exploration_points: number;
  achievements_points: number;
  contributor_count: number;
  population: number;
  weighted_score: number; // points per million inhabitants
}

// EU/EEA country populations (millions, 2024 Eurostat estimates)
const COUNTRY_POPULATIONS: Record<string, number> = {
  DE: 84.4, FR: 68.2, IT: 58.9, ES: 48.1, PL: 37.6, RO: 19.0, NL: 17.9,
  BE: 11.7, CZ: 10.9, GR: 10.4, SE: 10.5, PT: 10.3, HU: 9.6, AT: 9.1,
  BG: 6.4, DK: 5.9, FI: 5.6, SK: 5.4, IE: 5.3, HR: 3.9, LT: 2.9,
  SI: 2.1, LV: 1.8, EE: 1.4, CY: 0.9, LU: 0.67, MT: 0.54,
  // EEA
  NO: 5.5, IS: 0.38, LI: 0.04,
  // Fallback for others
};

// Detect user's country: prefer profile setting, fallback to IP
async function detectUserCountry(userId?: string): Promise<{ code: string; name: string } | null> {
  // Check if user has a profile country set
  if (userId) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("leaderboard_country_code, leaderboard_country_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.leaderboard_country_code) {
        const result = { code: data.leaderboard_country_code, name: data.leaderboard_country_name || data.leaderboard_country_code };
        sessionStorage.setItem("user-country", JSON.stringify(result));
        return result;
      }
    } catch {
      // fallback
    }
  }

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

interface LeaderboardRow {
  id: string;
  contributor_hash: string;
  country_code: string;
  country_name: string;
  category: string;
  points: number;
  source_detail: string | null;
  created_at: string;
}

export function useLeaderboard(timeRange: "all" | "month" | "week" = "all") {
  return useQuery({
    queryKey: ["leaderboard", timeRange],
    queryFn: async () => {
      let query = supabase.from("leaderboard_contributions_public" as any).select("*");

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
            population: COUNTRY_POPULATIONS[row.country_code] ?? 0,
            weighted_score: 0,
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

      // Calculate weighted score (points per million inhabitants)
      for (const entry of countryMap.values()) {
        entry.weighted_score = entry.population > 0
          ? Math.round((entry.total_points / entry.population) * 100) / 100
          : 0;
      }

      return Array.from(countryMap.values()).sort(
        (a, b) => b.total_points - a.total_points
      );
    },
    staleTime: 60_000,
  });
}

export function useTrackLeaderboard() {
  const { user } = useAuth();
  const countryRef = useRef<{ code: string; name: string } | null>(null);

  useEffect(() => {
    detectUserCountry(user?.id).then((c) => {
      countryRef.current = c;
    });
  }, [user?.id]);

  const track = useCallback(
    async (category: string, points = 1, sourceDetail?: string) => {
      try {
        const country = countryRef.current;

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
