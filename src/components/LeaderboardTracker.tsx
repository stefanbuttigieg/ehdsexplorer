import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTrackLeaderboard } from "@/hooks/useLeaderboard";

// Maps route patterns to leaderboard tracking categories & points
const ROUTE_TRACKING: Array<{
  pattern: RegExp;
  category: string;
  points: number;
  getDetail: (path: string) => string;
}> = [
  {
    pattern: /^\/article\/(\d+)$/,
    category: "reading",
    points: 3,
    getDetail: (p) => `article_${p.split("/")[2]}`,
  },
  {
    pattern: /^\/recital\/(\d+)$/,
    category: "reading",
    points: 2,
    getDetail: (p) => `recital_${p.split("/")[2]}`,
  },
  {
    pattern: /^\/annex\//,
    category: "reading",
    points: 2,
    getDetail: (p) => `annex_${p.split("/")[2]}`,
  },
  {
    pattern: /^\/implementing-acts\/[^/]+$/,
    category: "reading",
    points: 2,
    getDetail: (p) => `implementing_act_${p.split("/")[2]}`,
  },
  {
    pattern: /^\/definitions$/,
    category: "exploration",
    points: 1,
    getDetail: () => "definitions",
  },
  {
    pattern: /^\/overview$/,
    category: "exploration",
    points: 1,
    getDetail: () => "overview",
  },
  {
    pattern: /^\/for\//,
    category: "exploration",
    points: 1,
    getDetail: (p) => p.replace(/\//g, "_").slice(1),
  },
  {
    pattern: /^\/health-authorities$/,
    category: "exploration",
    points: 1,
    getDetail: () => "health_authorities",
  },
  {
    pattern: /^\/cross-regulation-map$/,
    category: "exploration",
    points: 1,
    getDetail: () => "cross_regulation",
  },
  {
    pattern: /^\/topic-index$/,
    category: "exploration",
    points: 1,
    getDetail: () => "topic_index",
  },
];

// Debounce tracking per-page (don't re-track same page in same session)
const trackedPaths = new Set<string>();

/**
 * Drop this component inside your Layout to auto-track page visits
 * for the leaderboard. Lightweight, non-blocking.
 */
export function LeaderboardTracker() {
  const location = useLocation();
  const { track } = useTrackLeaderboard();
  const lastPathRef = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;

    // Skip if already tracked this session
    if (trackedPaths.has(path)) return;

    const match = ROUTE_TRACKING.find((r) => r.pattern.test(path));
    if (match) {
      trackedPaths.add(path);
      // Delay to not block page load
      setTimeout(() => {
        track(match.category, match.points, match.getDetail(path));
      }, 2000);
    }
  }, [location.pathname, track]);

  return null;
}

/**
 * Call this from game completion handlers to track game points.
 * Example: trackGameScore("quiz", score);
 */
export function useGameLeaderboardTracker() {
  const { track } = useTrackLeaderboard();

  return {
    trackGameScore: (gameName: string, score: number) => {
      const points = Math.max(1, Math.min(score, 100));
      track("games", points, gameName);
    },
    trackAchievement: (achievementId: string, points: number) => {
      track("achievements", points, achievementId);
    },
  };
}
