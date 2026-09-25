import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, RefreshCw, Users, Globe, Search, X, Paperclip, Swords, Grid3x3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

type Group = { key: string; total: number; positive: number; neutral: number; negative: number };
type Theme = { theme: string; description: string; sentiment: string };
type Attachment = { id: number | string; name: string; pages?: number | null; size?: number | null };
type Comment = {
  id: number; feedback: string; user_type: string | null; country: string | null; organization: string | null;
  date_feedback: string | null; sentiment: string | null; sentiment_score: number | null; attachments: Attachment[] | null;
};
type Sent = "positive" | "neutral" | "negative";

const USER_TYPE_LABELS: Record<string, string> = {
  EU_CITIZEN: "EU citizen", NON_EU_CITIZEN: "Non-EU citizen", COMPANY: "Company",
  BUSINESS_ASSOCIATION: "Business association", NGO: "NGO", ACADEMIC_RESEARCH_INSTITTUTION: "Academic / research",
  PUBLIC_AUTHORITY: "Public authority", TRADE_UNION: "Trade union", CONSUMER_ORGANISATION: "Consumer organisation",
  ENVIRONMENTAL_ORGANISATION: "Environmental organisation", OTHER: "Other", UNKNOWN: "Unknown",
};
const label = (k: string) => USER_TYPE_LABELS[k] ?? k.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const sentimentClass: Record<string, string> = { positive: "bg-primary", neutral: "bg-muted-foreground/50", negative: "bg-destructive" };
const ATTACH_URL = "https://ec.europa.eu/info/law/better-regulation/api/download/";
const ART_RE = /\b(?:article|art\.?|artikel|articolo|art[ií]culo|artigo|artikkel|artykuł)\s*(\d{1,3})\b/gi;

function articleRefs(text: string): number[] {
  const s = new Set<number>();
  for (const m of text.matchAll(ART_RE)) { const n = +m[1]; if (n > 0 && n < 200) s.add(n); }
  return [...s];
}

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

function tally(rows: Comment[], keyFn: (c: Comment) => string[]) {
  const m = new Map<string, Group & { scoreSum: number; scored: number }>();
  for (const r of rows) for (const k of keyFn(r)) {
    const g = m.get(k) ?? { key: k, total: 0, positive: 0, neutral: 0, negative: 0, scoreSum: 0, scored: 0 };
    g.total++;
    if (r.sentiment && r.sentiment in sentimentClass) g[r.sentiment as Sent]++;
    if (typeof r.sentiment_score === "number") { g.scoreSum += r.sentiment_score; g.scored++; }
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

const scoreClass = (v: number) =>
  v >= 0.35 ? "bg-primary/40" : v >= 0.1 ? "bg-primary/20" : v > -0.1 ? "bg-muted" : v > -0.35 ? "bg-destructive/20" : "bg-destructive/40";

export default function ActFeedbackInsights({ implementingActId }: { implementingActId: string }) {
  const { isAdmin, isEditor } = useAuth();
  const canManage = isAdmin || isEditor;
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [word, setWord] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<Sent | null>(null);
  const [article, setArticle] = useState<number | null>(null);
  const [attachOnly, setAttachOnly] = useState(false);
  const [shown, setShown] = useState(20);

  const { data: a } = useQuery({
    queryKey: ["act-feedback-analysis", implementingActId],
    queryFn: async () => {
      const { data } = await supabase.from("implementing_act_feedback_analysis").select("*").eq("implementing_act_id", implementingActId).maybeSingle();
      return data;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["act-feedback-comments", implementingActId],
    enabled: !!a && (a.total_count ?? 0) > 0,
    queryFn: async () => {
      const { data } = await supabase.from("implementing_act_feedback")
        .select("id, feedback, user_type, country, organization, date_feedback, sentiment, sentiment_score, attachments")
        .eq("implementing_act_id", implementingActId).order("date_feedback", { ascending: false }).limit(2000);
      return (data ?? []) as unknown as Comment[];
    },
  });

  const refsById = useMemo(() => new Map(comments.map((c) => [c.id, articleRefs(c.feedback || "")])), [comments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const w = word?.toLowerCase();
    return comments.filter((c) => {
      const t = (c.feedback || "").toLowerCase();
      if (q && !t.includes(q) && !(c.organization || "").toLowerCase().includes(q)) return false;
      if (w && !t.includes(w)) return false;
      if (type && (c.user_type || "UNKNOWN") !== type) return false;
      if (country && (c.country || "UNKNOWN") !== country) return false;
      if (sentiment && c.sentiment !== sentiment) return false;
      if (article && !refsById.get(c.id)?.includes(article)) return false;
      if (attachOnly && !(c.attachments?.length)) return false;
      return true;
    });
  }, [comments, search, word, type, country, sentiment, article, attachOnly, refsById]);

  const contention = useMemo(
    () => tally(comments, (c) => (refsById.get(c.id) ?? []).map(String))
      .map((g) => ({ ...g, friction: g.total ? g.negative / g.total : 0 }))
      .sort((x, y) => y.negative - x.negative || y.total - x.total).slice(0, 10),
    [comments, refsById],
  );

  const matrix = useMemo(() => {
    const cols = tally(comments, (c) => [c.user_type || "UNKNOWN"]).slice(0, 5).map((g) => g.key);
    const rows = contention.slice(0, 8).map((g) => g.key);
    const cells = rows.map((art) => {
      const inRow = comments.filter((c) => refsById.get(c.id)?.includes(+art));
      const byCol = cols.map((col) => {
        const g = tally(inRow.filter((c) => (c.user_type || "UNKNOWN") === col), () => ["x"])[0];
        return g && g.scored ? { n: g.total, mean: g.scoreSum / g.scored } : null;
      });
      const means = byCol.filter((x): x is { n: number; mean: number } => !!x).map((x) => x.mean);
      const spread = means.length >= 2 ? Math.max(...means) - Math.min(...means) : null;
      const verdict = spread === null ? "Too few groups" : spread < 0.4 ? "Consensus" : spread >= 0.8 ? "Friction" : "Mixed";
      return { art, byCol, spread, verdict };
    });
    return { cols, cells };
  }, [comments, contention, refsById]);

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
  const activeFilters = [
    word && { k: "word", l: `"${word}"`, clear: () => setWord(null) },
    type && { k: "type", l: label(type), clear: () => setType(null) },
    country && { k: "country", l: country, clear: () => setCountry(null) },
    sentiment && { k: "sent", l: sentiment, clear: () => setSentiment(null) },
    article && { k: "art", l: `Article ${article}`, clear: () => setArticle(null) },
    attachOnly && { k: "att", l: "With attachments", clear: () => setAttachOnly(false) },
  ].filter(Boolean) as { k: string; l: string; clear: () => void }[];
  const clearAll = () => { setWord(null); setType(null); setCountry(null); setSentiment(null); setArticle(null); setAttachOnly(false); setSearch(""); };
  const toggle = <T,>(cur: T | null, v: T, set: (x: T | null) => void) => { set(cur === v ? null : v); setShown(20); };
  const withAttach = comments.filter((c) => c.attachments?.length).length;

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
          <div>
            <h3 className="text-sm font-semibold mb-2">Sentiment</h3>
            <SentimentBar g={{ positive: counts.positive ?? 0, neutral: counts.neutral ?? 0, negative: counts.negative ?? 0 }} />
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
              {(["positive", "neutral", "negative"] as const).map((s) => (
                <button key={s} onClick={() => toggle(sentiment, s, setSentiment)}
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 border ${sentiment === s ? "border-primary text-foreground" : "border-transparent hover:border-border"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${sentimentClass[s]}`} />
                  <span className="capitalize">{s}</span> {counts[s] ?? 0}
                  {analyzed > 0 && ` (${Math.round(((counts[s] ?? 0) / analyzed) * 100)}%)`}
                </button>
              ))}
            </div>
          </div>

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

          {words.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Most mentioned words <span className="font-normal text-xs text-muted-foreground">— click a word to filter comments</span></h3>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 p-4 rounded-lg bg-muted/50" aria-label="Word cloud">
                {words.map((w, i) => {
                  const r = w.value / max;
                  const active = word === w.text;
                  return (
                    <button key={w.text} onClick={() => toggle(word, w.text, setWord)} aria-pressed={active}
                      className={`rounded px-0.5 hover:underline ${active ? "bg-primary text-primary-foreground" : i % 3 === 0 ? "text-primary" : i % 3 === 1 ? "text-foreground" : "text-muted-foreground"}`}
                      style={{ fontSize: `${0.75 + r * 1.5}rem`, fontWeight: r > 0.5 ? 700 : r > 0.25 ? 600 : 400, lineHeight: 1.2 }}
                      title={`${w.value} mentions`}>
                      {w.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "By respondent type", icon: Users, list: byType, cur: type, set: setType, fmt: label },
              { title: "By country (top 10)", icon: Globe, list: byCountry, cur: country, set: setCountry, fmt: (k: string) => k },
            ].map(({ title, icon: Icon, list, cur, set, fmt }) => (
              <div key={title}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Icon className="h-4 w-4" /> {title}</h3>
                <div className="space-y-1">
                  {list.map((g) => (
                    <button key={g.key} onClick={() => toggle(cur, g.key, set)} aria-pressed={cur === g.key}
                      className={`w-full text-left rounded-md p-1.5 ${cur === g.key ? "bg-accent ring-1 ring-primary" : "hover:bg-muted"}`}>
                      <div className="flex justify-between text-xs mb-1"><span>{fmt(g.key)}</span><span className="text-muted-foreground">{g.total}</span></div>
                      <SentimentBar g={g} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Points of contention */}
          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Swords className="h-4 w-4" /> Points of contention</h3>
            <p className="text-xs text-muted-foreground mb-2">Articles of the draft act most often cited in comments, ranked by critical responses. Click to filter.</p>
            {contention.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments cite specific articles.</p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2">
                {contention.map((g) => (
                  <button key={g.key} onClick={() => toggle(article, +g.key, setArticle)} aria-pressed={article === +g.key}
                    className={`text-left rounded-md p-2 border ${article === +g.key ? "border-primary bg-accent" : "hover:bg-muted"}`}>
                    <div className="flex justify-between text-xs mb-1 gap-2">
                      <span className="font-medium">Article {g.key}</span>
                      <span className="text-muted-foreground">{g.total} cites · {Math.round(g.friction * 100)}% critical</span>
                    </div>
                    <SentimentBar g={g} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Consensus vs friction matrix */}
          {matrix.cells.length > 0 && matrix.cols.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Grid3x3 className="h-4 w-4" /> Consensus vs friction</h3>
              <p className="text-xs text-muted-foreground mb-2">Average sentiment per stakeholder group for each cited article. Large gaps between groups signal friction.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-muted-foreground">Article</th>
                      {matrix.cols.map((c) => <th key={c} className="font-medium text-muted-foreground min-w-[70px]">{label(c)}</th>)}
                      <th className="font-medium text-muted-foreground">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.cells.map((r) => (
                      <tr key={r.art}>
                        <td className="font-medium whitespace-nowrap">Art. {r.art}</td>
                        {r.byCol.map((c, i) => (
                          <td key={i} className={`text-center rounded px-1 py-1.5 ${c ? scoreClass(c.mean) : "bg-muted/30 text-muted-foreground"}`}
                            title={c ? `${c.n} comments, avg ${c.mean.toFixed(2)}` : "No comments"}>
                            {c ? `${c.mean > 0 ? "+" : ""}${c.mean.toFixed(1)}` : "–"}
                          </td>
                        ))}
                        <td className="text-center">
                          <Badge variant={r.verdict === "Friction" ? "destructive" : r.verdict === "Consensus" ? "default" : "outline"} className="text-[10px]">{r.verdict}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comment explorer */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Comments</h3>
            <div className="flex gap-2 flex-wrap items-center mb-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setShown(20); }} placeholder="Search comments or organisations…" className="pl-8" aria-label="Search comments" />
              </div>
              {withAttach > 0 && (
                <Button size="sm" variant={attachOnly ? "default" : "outline"} onClick={() => setAttachOnly(!attachOnly)}>
                  <Paperclip className="h-4 w-4 mr-1" /> With attachments ({withAttach})
                </Button>
              )}
            </div>
            {(activeFilters.length > 0 || search) && (
              <div className="flex gap-1.5 flex-wrap items-center mb-2">
                {activeFilters.map((f) => (
                  <Badge key={f.k} variant="secondary" className="gap-1 capitalize">
                    {f.l}<button onClick={f.clear} aria-label={`Remove ${f.l} filter`}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={clearAll}>Clear all</Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2">Showing {Math.min(shown, filtered.length)} of {filtered.length} matching comments</p>
            <div className="space-y-2">
              {filtered.slice(0, shown).map((c) => {
                const refs = refsById.get(c.id) ?? [];
                return (
                  <div key={c.id} className="p-3 rounded-lg border text-sm">
                    <div className="flex gap-2 flex-wrap items-center mb-1 text-xs text-muted-foreground">
                      {c.sentiment && <Badge variant="outline" className="capitalize text-xs">{c.sentiment}</Badge>}
                      <span>{label(c.user_type ?? "UNKNOWN")}</span>
                      {c.organization && <span>· {c.organization}</span>}
                      {c.country && <span>· {c.country}</span>}
                      {c.date_feedback && <span>· {format(new Date(c.date_feedback), "dd MMM yyyy")}</span>}
                      {refs.map((n) => (
                        <button key={n} onClick={() => toggle(article, n, setArticle)}>
                          <Badge variant="secondary" className="text-[10px]">Art. {n}</Badge>
                        </button>
                      ))}
                    </div>
                    <p className="whitespace-pre-line break-words line-clamp-[12]">{c.feedback}</p>
                    {!!c.attachments?.length && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {c.attachments.map((f) => (
                          <a key={f.id} href={`${ATTACH_URL}${f.id}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all">
                            <Paperclip className="h-3 w-3 shrink-0" />{f.name}{f.pages ? ` (${f.pages} p.)` : ""}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {shown < filtered.length && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShown(shown + 30)}>Show more</Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
