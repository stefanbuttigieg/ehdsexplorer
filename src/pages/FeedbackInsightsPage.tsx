import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareText, Users, Globe, Search, ArrowUpDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEOHead } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Group = { key: string; total: number; positive: number; neutral: number; negative: number };
type Row = {
  implementing_act_id: string; total_count: number; analyzed_count: number;
  sentiment_counts: Record<string, number> | null; word_cloud: { text: string; value: number }[] | null;
  by_user_type: Group[] | null; by_country: Group[] | null; themes_summary: string | null;
  key_themes: { theme: string; description: string; sentiment: string }[] | null; last_synced_at: string | null;
};
type Act = { id: string; title: string; article_reference: string; status: string; feedback_deadline?: string | null };

const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const SENT = [
  { k: "positive", cls: "bg-primary" },
  { k: "neutral", cls: "bg-muted-foreground/50" },
  { k: "negative", cls: "bg-destructive" },
] as const;

function SentimentBar({ c }: { c: Record<string, number> }) {
  const total = (c.positive ?? 0) + (c.neutral ?? 0) + (c.negative ?? 0);
  if (!total) return <div className="h-2 rounded-full bg-muted" />;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-label={`Positive ${c.positive}, neutral ${c.neutral}, negative ${c.negative}`}>
      {SENT.map((s) => <div key={s.k} className={s.cls} style={{ width: `${((c[s.k] ?? 0) / total) * 100}%` }} />)}
    </div>
  );
}

function merge(rows: Row[], field: "by_user_type" | "by_country") {
  const m = new Map<string, Group>();
  for (const r of rows) for (const g of r[field] ?? []) {
    const e = m.get(g.key) ?? { key: g.key, total: 0, positive: 0, neutral: 0, negative: 0 };
    e.total += g.total; e.positive += g.positive; e.neutral += g.neutral; e.negative += g.negative;
    m.set(g.key, e);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export default function FeedbackInsightsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"comments" | "negative" | "positive">("comments");
  const [session, setSession] = useState<"all" | "open" | "past">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["feedback-insights-all"],
    queryFn: async () => {
      const [{ data: rows }, { data: acts }] = await Promise.all([
        supabase.from("implementing_act_feedback_analysis").select("*").gt("total_count", 0),
        supabase.from("implementing_acts").select("id, title, article_reference, status, feedback_deadline"),
      ]);
      return { rows: (rows ?? []) as unknown as Row[], acts: new Map(((acts ?? []) as Act[]).map((a) => [a.id, a])) };
    },
  });

  const allRows = data?.rows ?? [];
  const acts = data?.acts ?? new Map<string, Act>();
  const isOpen = (r: Row) => acts.get(r.implementing_act_id)?.status === "feedback";
  const openCount = allRows.filter(isOpen).length;
  const rows = allRows.filter((r) => session === "all" || (session === "open" ? isOpen(r) : !isOpen(r)));

  const totals = useMemo(() => {
    const s = { positive: 0, neutral: 0, negative: 0 };
    let comments = 0;
    for (const r of rows) {
      comments += r.total_count;
      for (const k of Object.keys(s) as (keyof typeof s)[]) s[k] += r.sentiment_counts?.[k] ?? 0;
    }
    const words = new Map<string, number>();
    for (const r of rows) for (const w of r.word_cloud ?? []) words.set(w.text, (words.get(w.text) ?? 0) + w.value);
    return {
      comments, s,
      words: [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60),
      userTypes: merge(rows, "by_user_type"),
      countries: merge(rows, "by_country"),
    };
  }, [rows]);

  const share = (r: Row, k: string) => {
    const c = r.sentiment_counts ?? {};
    const t = (c.positive ?? 0) + (c.neutral ?? 0) + (c.negative ?? 0);
    return t ? (c[k] ?? 0) / t : 0;
  };

  const list = useMemo(() => {
    const term = q.toLowerCase();
    return rows
      .filter((r) => !term || (acts.get(r.implementing_act_id)?.title ?? "").toLowerCase().includes(term) || r.implementing_act_id.toLowerCase().includes(term))
      .sort((a, b) => sort === "comments" ? b.total_count - a.total_count : share(b, sort) - share(a, sort));
  }, [rows, acts, q, sort]);

  const maxWord = totals.words[0]?.[1] ?? 1;
  const pct = (n: number) => totals.comments ? Math.round((n / (totals.s.positive + totals.s.neutral + totals.s.negative || 1)) * 100) : 0;

  return (
    <Layout>
      <SEOHead title="Public Feedback Insights – EHDS Implementing Acts" description="Sentiment, key themes and stakeholder breakdown of public feedback submitted on all EHDS implementing acts." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumbs items={[{ label: "Implementing Acts", href: "/implementing-acts" }, { label: "Feedback Insights" }]} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif">Public Feedback Insights</h1>
          <p className="text-muted-foreground mt-1">What people told the European Commission about each EHDS implementing act on its "Have your say" page.</p>
        </div>

        {isLoading ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? (
          <Card><CardContent className="p-6 text-muted-foreground">No feedback has been collected yet.</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { l: "Acts with feedback", v: rows.length },
                { l: "Comments", v: totals.comments },
                { l: "Positive", v: `${pct(totals.s.positive)}%` },
                { l: "Negative", v: `${pct(totals.s.negative)}%` },
              ].map((s) => (
                <Card key={s.l}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.l}</p><p className="text-2xl font-bold">{s.v}</p></CardContent></Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Overall sentiment</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <SentimentBar c={totals.s} />
                <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                  {SENT.map((s) => <span key={s.k} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${s.cls}`} />{label(s.k)}: {totals.s[s.k]}</span>)}
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />By respondent type</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {totals.userTypes.slice(0, 10).map((g) => (
                    <div key={g.key}>
                      <div className="flex justify-between text-sm mb-1"><span>{label(g.key)}</span><span className="text-muted-foreground">{g.total}</span></div>
                      <SentimentBar c={g as unknown as Record<string, number>} />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />By country</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {totals.countries.slice(0, 10).map((g) => (
                    <div key={g.key}>
                      <div className="flex justify-between text-sm mb-1"><span>{g.key}</span><span className="text-muted-foreground">{g.total}</span></div>
                      <SentimentBar c={g as unknown as Record<string, number>} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Most-used words across all acts</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                {totals.words.map(([w, v]) => (
                  <span key={w} className="text-primary" style={{ fontSize: `${0.75 + (v / maxWord) * 1.25}rem`, opacity: 0.55 + (v / maxWord) * 0.45 }}>{w}</span>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 space-y-3">
                <CardTitle className="text-base flex items-center gap-2"><MessageSquareText className="h-4 w-4" />Acts compared</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search acts…" className="pl-8" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(["comments", "positive", "negative"] as const).map((s) => (
                      <Button key={s} size="sm" variant={sort === s ? "default" : "outline"} onClick={() => setSort(s)} className="gap-1">
                        <ArrowUpDown className="h-3 w-3" />{s === "comments" ? "Most comments" : `Most ${s}`}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {list.map((r) => {
                  const act = acts.get(r.implementing_act_id);
                  return (
                    <Link key={r.implementing_act_id} to={`/implementing-acts/${r.implementing_act_id}`} className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium break-words">{act?.title ?? r.implementing_act_id}</p>
                          <div className="flex gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
                            {act?.article_reference && <Badge variant="outline" className="text-xs">{act.article_reference}</Badge>}
                            <span>{r.total_count} comments</span>
                            {r.last_synced_at && <span>· updated {format(new Date(r.last_synced_at), "dd MMM yyyy")}</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <SentimentBar c={r.sentiment_counts ?? {}} />
                      {!!r.key_themes?.length && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {r.key_themes.slice(0, 4).map((t) => <Badge key={t.theme} variant="secondary" className="text-[10px]">{t.theme}</Badge>)}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">Sentiment and themes are AI-generated from comments in all languages. Source: European Commission "Have your say" portal.</p>
          </>
        )}
      </div>
    </Layout>
  );
}
