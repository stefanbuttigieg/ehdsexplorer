import { useMemo, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";

export type TimelineItem = { date_feedback: string | null; sentiment: string | null };

const SEGS = [
  { k: "positive", cls: "bg-primary" },
  { k: "neutral", cls: "bg-muted-foreground/50" },
  { k: "negative", cls: "bg-destructive" },
  { k: "pending", cls: "bg-muted-foreground/20" },
] as const;

export function FeedbackTimeline({ items }: { items: TimelineItem[] }) {
  const [unit, setUnit] = useState<"day" | "week" | "month">("week");

  const { buckets, max, dated, first, last, peak } = useMemo(() => {
    const m = new Map<string, { label: string; total: number; positive: number; neutral: number; negative: number; pending: number }>();
    let dated = 0, first: Date | null = null, last: Date | null = null;
    for (const it of items) {
      if (!it.date_feedback) continue;
      const d = new Date(it.date_feedback);
      if (isNaN(+d)) continue;
      dated++;
      if (!first || d < first) first = d;
      if (!last || d > last) last = d;
      const b = unit === "day" ? d : unit === "week" ? startOfWeek(d, { weekStartsOn: 1 }) : new Date(d.getFullYear(), d.getMonth(), 1);
      const key = format(b, "yyyy-MM-dd");
      const label = unit === "month" ? format(b, "MMM yyyy") : unit === "week" ? `Week of ${format(b, "dd MMM yyyy")}` : format(b, "dd MMM yyyy");
      const e = m.get(key) ?? { label, total: 0, positive: 0, neutral: 0, negative: 0, pending: 0 };
      e.total++;
      const s = it.sentiment === "positive" || it.sentiment === "neutral" || it.sentiment === "negative" ? it.sentiment : "pending";
      e[s]++;
      m.set(key, e);
    }
    const buckets = [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    const peak = buckets.reduce<(typeof buckets)[number] | null>((p, b) => (!p || b.total > p.total ? b : p), null);
    return { buckets, max: Math.max(1, ...buckets.map((b) => b.total)), dated, first, last, peak };
  }, [items, unit]);

  if (!dated) return <p className="text-sm text-muted-foreground">No submission dates available yet.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
          <span>First: <strong className="text-foreground">{format(first!, "dd MMM yyyy")}</strong></span>
          <span>Latest: <strong className="text-foreground">{format(last!, "dd MMM yyyy")}</strong></span>
          {peak && <span>Busiest: <strong className="text-foreground">{peak.label}</strong> ({peak.total})</span>}
        </div>
        <div className="flex gap-1" role="group" aria-label="Group by">
          {(["day", "week", "month"] as const).map((u) => (
            <Button key={u} size="sm" variant={unit === u ? "default" : "outline"} className="h-7 px-2 text-xs capitalize" onClick={() => setUnit(u)} aria-pressed={unit === u}>{u}</Button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-1 h-40 min-w-full" style={{ width: buckets.length > 40 ? buckets.length * 10 : undefined }}>
          {buckets.map((b) => (
            <div key={b.label} className="flex-1 min-w-[6px] h-full flex flex-col justify-end group" title={`${b.label}: ${b.total} comments (${b.positive} positive, ${b.neutral} neutral, ${b.negative} negative)`}>
              <div className="flex flex-col-reverse w-full rounded-t overflow-hidden group-hover:opacity-80" style={{ height: `${(b.total / max) * 100}%` }}>
                {SEGS.map((s) => b[s.k] > 0 && <div key={s.k} className={s.cls} style={{ height: `${(b[s.k] / b.total) * 100}%` }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{buckets[0]?.label}</span><span>{buckets[buckets.length - 1]?.label}</span>
      </div>
    </div>
  );
}
