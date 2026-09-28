import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useImplementingActs } from "@/hooks/useImplementingActs";

interface Chip {
  key: string;
  label: string;
  to: string;
  live?: boolean;
}

const FALLBACK = ["Secondary use", "Electronic health records", "Opt-out rights", "Health data access bodies", "Patient summary"];
const MAX_CHIPS = 7;

// Stable per-day shuffle so chips rotate daily without jumping on every render
const dailyShuffle = <T,>(arr: T[]) => {
  const seed = Math.floor(Date.now() / 86400000);
  return arr
    .map((v, i) => ({ v, r: Math.sin(seed * 9301 + i * 49297) }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.v);
};

export const PopularTopicChips = () => {
  const { data: acts = [] } = useImplementingActs();
  const { data: topics = [] } = useQuery({
    queryKey: ["popular-topic-chips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topic_article_index")
        .select("topic")
        .eq("is_active", true)
        .limit(200);
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((d) => d.topic).filter(Boolean)));
    },
    staleTime: 1000 * 60 * 30,
  });

  const chips = useMemo<Chip[]>(() => {
    const live: Chip[] = acts
      .filter((a) => a.status === "feedback")
      .slice(0, 2)
      .map((a) => ({
        key: `act-${a.id}`,
        label: `Feedback open: ${a.articleReference}`,
        to: `/implementing-acts/${a.id}`,
        live: true,
      }));
    const pool = topics.length ? dailyShuffle(topics) : FALLBACK;
    const topicChips: Chip[] = pool.slice(0, MAX_CHIPS - live.length).map((t) => ({
      key: `t-${t}`,
      label: t,
      to: `/search?q=${encodeURIComponent(t)}`,
    }));
    return [...live, ...topicChips];
  }, [acts, topics]);

  if (!chips.length) return null;

  return (
    <nav aria-label="Popular topics" className="mt-4 flex flex-wrap justify-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mr-1">
        <TrendingUp className="h-3.5 w-3.5" /> Popular:
      </span>
      {chips.map((c) => (
        <Link
          key={c.key}
          to={c.to}
          className={
            c.live
              ? "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              : "inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
          }
        >
          {c.live && <MessageSquare className="h-3 w-3" />}
          {c.label}
        </Link>
      ))}
    </nav>
  );
};
