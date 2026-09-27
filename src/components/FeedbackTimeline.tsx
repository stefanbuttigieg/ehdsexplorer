import { useMemo, useState } from "react";
import { format, startOfWeek, startOfDay, startOfMonth, addDays, addWeeks, addMonths, parse, isValid } from "date-fns";
import { Button } from "@/components/ui/button";

export type TimelineItem = { date_feedback: string | null; sentiment: string | null };
export type TimelineMarker = { date: Date; label: string; kind: "open" | "close" };

/** Parses "dd Month yyyy - dd Month yyyy" (or a single date) into open/close markers. */
export function deadlineMarkers(deadline: string | null | undefined, name?: string): TimelineMarker[] {
  if (!deadline) return [];
  const parts = deadline.split(" - ").map((s) => s.trim());
  const toDate = (s: string) => {
    for (const f of ["d MMMM yyyy", "dd MMMM yyyy", "d MMM yyyy", "yyyy-MM-dd"]) {
      const d = parse(s, f, new Date());
      if (isValid(d)) return d;
    }
    return null;
  };
  const prefix = name ? `${name}: ` : "";
  const out: TimelineMarker[] = [];
  if (parts.length > 1) {
    const o = toDate(parts[0]);
    if (o) out.push({ date: o, label: `${prefix}feedback opened ${format(o, "dd MMM yyyy")}`, kind: "open" });
  }
  const c = toDate(parts[parts.length - 1]);
  if (c) out.push({ date: c, label: `${prefix}feedback deadline ${format(c, "dd MMM yyyy")}`, kind: "close" });
  return out;
}

const SEGS = [
  { k: "positive", cls: "bg-primary" },
  { k: "neutral", cls: "bg-muted-foreground/50" },
  { k: "negative", cls: "bg-destructive" },
  { k: "pending", cls: "bg-muted-foreground/20" },
] as const;

type Unit = "day" | "week" | "month";
const floor = (d: Date, u: Unit) => (u === "day" ? startOfDay(d) : u === "week" ? startOfWeek(d, { weekStartsOn: 1 }) : startOfMonth(d));
const step = (d: Date, u: Unit) => (u === "day" ? addDays(d, 1) : u === "week" ? addWeeks(d, 1) : addMonths(d, 1));
const labelOf = (d: Date, u: Unit) => (u === "month" ? format(d, "MMM yyyy") : u === "week" ? `Week of ${format(d, "dd MMM yyyy")}` : format(d, "dd MMM yyyy"));

export function FeedbackTimeline({ items, markers = [] }: { items: TimelineItem[]; markers?: TimelineMarker[] }) {
  const [unit, setUnit] = useState<Unit>("week");

  const { buckets, max, dated, first, last, peak } = useMemo(() => {
    const counts = new Map<number, { total: number; positive: number; neutral: number; negative: number; pending: number }>();
    let dated = 0, first: Date | null = null, last: Date | null = null;
    for (const it of items) {
      if (!it.date_feedback) continue;
      const d = new Date(it.date_feedback);
      if (isNaN(+d)) continue;
      dated++;
      if (!first || d < first) first = d;
      if (!last || d > last) last = d;
      const k = +floor(d, unit);
      const e = counts.get(k) ?? { total: 0, positive: 0, neutral: 0, negative: 0, pending: 0 };
      e.total++;
      const s = it.sentiment === "positive" || it.sentiment === "neutral" || it.sentiment === "negative" ? it.sentiment : "pending";
      e[s]++;
      counts.set(k, e);
    }
    if (!first || !last) return { buckets: [], max: 1, dated, first, last, peak: null };
    // Range covers comments plus any deadline markers, with empty periods filled in.
    let start = first, end = last;
    for (const m of markers) { if (m.date < start) start = m.date; if (m.date > end) end = m.date; }
    const buckets: { key: number; label: string; total: number; positive: number; neutral: number; negative: number; pending: number; markers: TimelineMarker[] }[] = [];
    for (let d = floor(start, unit); d <= end && buckets.length < 800; d = step(d, unit)) {
      const c = counts.get(+d) ?? { total: 0, positive: 0, neutral: 0, negative: 0, pending: 0 };
      buckets.push({ key: +d, label: labelOf(d, unit), ...c, markers: [] });
    }
    for (const m of markers) {
      const b = buckets.find((x) => x.key === +floor(m.date, unit));
      if (b) b.markers.push(m);
    }
    const peak = buckets.reduce<(typeof buckets)[number] | null>((p, b) => (!p || b.total > p.total ? b : p), null);
    return { buckets, max: Math.max(1, ...buckets.map((b) => b.total)), dated, first, last, peak };
  }, [items, unit, markers]);

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
        <div className="flex items-end gap-1 h-44 min-w-full pt-4" style={{ width: buckets.length > 40 ? buckets.length * 10 : undefined }}>
          {buckets.map((b) => {
            const close = b.markers.some((m) => m.kind === "close");
            const tip = [`${b.label}: ${b.total} comments (${b.positive} positive, ${b.neutral} neutral, ${b.negative} negative)`, ...b.markers.map((m) => m.label)].join("\n");
            return (
              <div key={b.key} className="relative flex-1 min-w-[6px] h-full flex flex-col justify-end group" title={tip}>
                {b.markers.length > 0 && (
                  <>
                    <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed ${close ? "border-destructive/70" : "border-primary/60"}`} aria-hidden />
                    <span className={`absolute -top-4 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full ring-2 ring-background ${close ? "bg-destructive" : "bg-primary"}`} aria-label={b.markers.map((m) => m.label).join("; ")} />
                    {b.markers.length > 1 && <span className="absolute -top-4 left-1/2 ml-2 text-[10px] text-muted-foreground">{b.markers.length}</span>}
                  </>
                )}
                <div className="relative flex flex-col-reverse w-full rounded-t overflow-hidden group-hover:opacity-80" style={{ height: `${(b.total / max) * 100}%` }}>
                  {SEGS.map((s) => b[s.k] > 0 && <div key={s.k} className={s.cls} style={{ height: `${(b[s.k] / b.total) * 100}%` }} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{buckets[0]?.label}</span><span>{buckets[buckets.length - 1]?.label}</span>
      </div>
      {markers.length > 0 && (
        <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Feedback opened</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" />Feedback deadline</span>
          <span>Hover a marker for details.</span>
        </div>
      )}
    </div>
  );
}
