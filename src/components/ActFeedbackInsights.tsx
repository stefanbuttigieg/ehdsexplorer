import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, RefreshCw, Users, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

type Group = { key: string; total: number; positive: number; neutral: number; negative: number };
type Theme = { theme: string; description: string; sentiment: string };

const USER_TYPE_LABELS: Record<string, string> = {
  EU_CITIZEN: "EU citizen", NON_EU_CITIZEN: "Non-EU citizen", COMPANY: "Company",
  BUSINESS_ASSOCIATION: "Business association", NGO: "NGO", ACADEMIC_RESEARCH_INSTITTUTION: "Academic / research",
  PUBLIC_AUTHORITY: "Public authority", TRADE_UNION: "Trade union", CONSUMER_ORGANISATION: "Consumer organisation",
  ENVIRONMENTAL_ORGANISATION: "Environmental organisation", OTHER: "Other", UNKNOWN: "Unknown",
};
const label = (k: string) => USER_TYPE_LABELS[k] ?? k.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const sentimentClass: Record<string, string> = {
  positive: "bg-primary", neutral: "bg-muted-foreground/50", negative: "bg-destructive",
};

function SentimentBar({ g }: { g: { positive: number; neutral: number; negative: number } }) {
  const total = g.positive + g.neutral + g.negative || 1;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
      {(["positive", "neutral", "negative"] as const).map((s) => (
        <div key={s} className={sentimentClass[s]} style={{ width: `${(g[s] / total) * 100}%` }} title={`${s}: ${g[s]}`} />
      ))}
    </div>
  );
}

export default function ActFeedbackInsights({ implementingActId }: { implementingActId: string }) {
  const { isAdmin, isEditor } = useAuth();
  const canManage = isAdmin || isEditor;
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: a } = useQuery({
    queryKey: ["act-feedback-analysis", implementingActId],
    queryFn: async () => {
      const { data } = await supabase.from("implementing_act_feedback_analysis").select("*").eq("implementing_act_id", implementingActId).maybeSingle();
      return data;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["act-feedback-comments", implementingActId],
    enabled: canManage,
    queryFn: async () => {
      const { data } = await supabase.from("implementing_act_feedback").select("*").eq("implementing_act_id", implementingActId).order("date_feedback", { ascending: false }).limit(1000);
      return data ?? [];
    },
  });

  const refresh = async () => {
    setRefreshing(true);
    const { data, error } = await supabase.functions.invoke("sync-act-feedback", { body: { implementingActId } });
    setRefreshing(false);
    const r = data?.results?.[0];
    if (error || r?.error) toast.error(r?.error || error?.message || "Refresh failed");
    else if (r?.skipped) toast.info(`Skipped: ${r.skipped}`);
    else toast.success(`Collected ${r?.comments ?? 0} comments`);
    qc.invalidateQueries({ queryKey: ["act-feedback-analysis", implementingActId] });
    qc.invalidateQueries({ queryKey: ["act-feedback-comments", implementingActId] });
  };

  if (!a && !canManage) return null;
  if (a && a.total_count === 0 && !canManage) return null;

  const counts = (a?.sentiment_counts ?? {}) as Record<string, number>;
  const words = ((a?.word_cloud ?? []) as { text: string; value: number }[]).slice(0, 60);
  const max = words[0]?.value ?? 1;
  const themes = (a?.key_themes ?? []) as Theme[];
  const byType = (a?.by_user_type ?? []) as Group[];
  const byCountry = ((a?.by_country ?? []) as Group[]).slice(0, 10);
  const analyzed = (counts.positive ?? 0) + (counts.neutral ?? 0) + (counts.negative ?? 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Public Feedback Insights
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {a?.total_count ? `Based on ${a.total_count} comments from the Commission's "Have your say" portal.` : "No comments collected yet."}
              {a?.last_synced_at && ` Updated ${format(new Date(a.last_synced_at), "dd MMM yyyy")}.`}
            </p>
          </div>
          {canManage && (
            <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Collecting…" : "Refresh comments"}
            </Button>
          )}
        </div>
        {canManage && a?.status === "error" && a.last_error && (
          <p className="text-xs text-destructive mt-2">Last refresh failed: {a.last_error}</p>
        )}
      </CardHeader>

      {a && a.total_count > 0 && (
        <CardContent className="space-y-6">
          {/* Sentiment */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Sentiment</h3>
            <SentimentBar g={{ positive: counts.positive ?? 0, neutral: counts.neutral ?? 0, negative: counts.negative ?? 0 }} />
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {(["positive", "neutral", "negative"] as const).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${sentimentClass[s]}`} />
                  <span className="capitalize">{s}</span> {counts[s] ?? 0}
                  {analyzed > 0 && ` (${Math.round(((counts[s] ?? 0) / analyzed) * 100)}%)`}
                </span>
              ))}
            </div>
          </div>

          {/* Summary + themes */}
          {a.themes_summary && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Key themes</h3>
              <p className="text-sm legal-text mb-3">{a.themes_summary}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {themes.map((t, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${sentimentClass[t.sentiment] ?? sentimentClass.neutral}`} />
                      <span className="text-sm font-medium">{t.theme}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">AI-generated summary — may contain inaccuracies.</p>
            </div>
          )}

          {/* Word cloud */}
          {words.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Most mentioned words</h3>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 p-4 rounded-lg bg-muted/50" aria-label="Word cloud">
                {words.map((w, i) => {
                  const r = w.value / max;
                  return (
                    <span
                      key={w.text}
                      className={i % 3 === 0 ? "text-primary" : i % 3 === 1 ? "text-foreground" : "text-muted-foreground"}
                      style={{ fontSize: `${0.75 + r * 1.5}rem`, fontWeight: r > 0.5 ? 700 : r > 0.25 ? 600 : 400, lineHeight: 1.2 }}
                      title={`${w.value} mentions`}
                    >
                      {w.text}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stakeholder breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Users className="h-4 w-4" /> By respondent type</h3>
              <div className="space-y-2">
                {byType.map((g) => (
                  <div key={g.key}>
                    <div className="flex justify-between text-xs mb-1"><span>{label(g.key)}</span><span className="text-muted-foreground">{g.total}</span></div>
                    <SentimentBar g={g} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Globe className="h-4 w-4" /> By country (top 10)</h3>
              <div className="space-y-2">
                {byCountry.map((g) => (
                  <div key={g.key}>
                    <div className="flex justify-between text-xs mb-1"><span>{g.key}</span><span className="text-muted-foreground">{g.total}</span></div>
                    <SentimentBar g={g} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin: full list */}
          {canManage && comments.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">Show all {comments.length} comments (admin)</Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2 max-h-[600px] overflow-y-auto">
                {comments.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-lg border text-sm">
                    <div className="flex gap-2 flex-wrap items-center mb-1 text-xs text-muted-foreground">
                      {c.sentiment && <Badge variant="outline" className="capitalize text-xs">{c.sentiment}</Badge>}
                      <span>{label(c.user_type ?? "UNKNOWN")}</span>
                      {c.organization && <span>· {c.organization}</span>}
                      {c.country && <span>· {c.country}</span>}
                      {c.date_feedback && <span>· {format(new Date(c.date_feedback), "dd MMM yyyy")}</span>}
                    </div>
                    <p className="whitespace-pre-line break-words">{c.feedback}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      )}
    </Card>
  );
}
