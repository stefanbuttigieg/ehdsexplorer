import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BRP = "https://ec.europa.eu/info/law/better-regulation";
const AI_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";
const SENTIMENT_BATCH = 25;
const MAX_SENTIMENT_PER_ACT = 150; // bound per run
const MAX_PAGES = 20;
const EC_HEADERS = { "Accept-Encoding": "identity", Accept: "application/json", "User-Agent": "Mozilla/5.0 EHDSExplorer" };

class AiStop extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

// ---------- AI (Responses API, streamed) ----------
async function aiText(apiKey: string, instructions: string, input: string): Promise<string> {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      instructions,
      input,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    throw new AiStop(res.status, `AI ${res.status}: ${t.slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
        else if (ev.type === "error" || ev.type === "response.failed") {
          throw new AiStop(500, ev.error?.message || ev.response?.error?.message || "AI stream error");
        }
      } catch (e) { if (e instanceof AiStop) throw e; }
    }
  }
  if (!out.trim()) throw new AiStop(200, "AI returned empty output");
  return out;
}
function parseJson(text: string) {
  const m = text.match(/[\[{][\s\S]*[\]}]/);
  return JSON.parse(m ? m[0] : text);
}

// ---------- word cloud ----------
const STOP = new Set(`a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours shall may might must would should etc e.g i.e eu ehds european commission act regulation article member states state data health also use used using well within without however therefore order new one two
der die das und ist zu den von mit für auf im des nicht eine ein sich es als auch dem werden bei oder sind wird kann le la les des et en du un une pour dans que qui sur par pas est au aux ce il de da del el los las y por con para una se lo`.split(/\s+/));
function wordCloud(texts: string[]) {
  const freq = new Map<string, number>();
  for (const t of texts) {
    for (const w of t.toLowerCase().replace(/https?:\/\/\S+/g, " ").match(/[\p{L}][\p{L}\-']{2,}/gu) ?? []) {
      if (STOP.has(w) || w.length < 4) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 80).map(([text, value]) => ({ text, value }));
}

function group(rows: any[], key: string) {
  const m = new Map<string, any>();
  for (const r of rows) {
    const k = r[key] || "UNKNOWN";
    const g = m.get(k) ?? { key: k, total: 0, positive: 0, neutral: 0, negative: 0 };
    g.total++;
    if (r.sentiment && g[r.sentiment] !== undefined) g[r.sentiment]++;
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

// ---------- EC portal ----------
async function fetchComments(initiativeId: string) {
  const gi = await fetch(`${BRP}/brpapi/groupInitiatives/${initiativeId}`, { headers: EC_HEADERS });
  if (!gi.ok) throw new Error(`EC portal ${gi.status}`);
  const pubs = ((await gi.json()).publications ?? []).filter((p: any) => (p.totalFeedback ?? 0) > 0);
  const all: any[] = [];
  for (const p of pubs) {
    for (let page = 0; page < MAX_PAGES; page++) {
      const r = await fetch(`${BRP}/api/allFeedback?publicationId=${p.id}&page=${page}&size=100`, { headers: EC_HEADERS });
      if (!r.ok) break;
      const d = await r.json();
      all.push(...(d.content ?? []));
      if (d.last || !d.content?.length) break;
    }
  }
  return all;
}

async function processAct(sb: any, apiKey: string, act: any) {
  const link = act.feedback_link || act.official_link || "";
  const m = link.match(/initiatives\/(\d+)/);
  if (!m) return { id: act.id, skipped: "no Have your say link" };
  const initiativeId = m[1];
  await sb.from("implementing_act_feedback_analysis").upsert({ implementing_act_id: act.id, initiative_id: initiativeId, status: "syncing", last_error: null });

  const comments = await fetchComments(initiativeId);
  if (comments.length) {
    const rows = comments.map((c) => ({
      id: c.id,
      implementing_act_id: act.id,
      publication_id: c.publicationId,
      date_feedback: c.dateFeedback ? new Date(c.dateFeedback.replace(/\//g, "-").replace(" ", "T") + "Z").toISOString() : null,
      feedback: c.feedback ?? "",
      language: c.language,
      user_type: c.userType,
      country: c.country,
      organization: c.organization || null,
      company_size: c.companySize || null,
      attachments: (c.attachments ?? []).filter((x: any) => x?.documentId).map((x: any) => ({
        id: x.documentId, name: x.fileName || x.ersFileName || "Attachment", pages: x.pages ?? null, size: x.size ?? null,
      })),
    }));
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await sb.from("implementing_act_feedback").upsert(rows.slice(i, i + 200), { onConflict: "id", ignoreDuplicates: false });
      if (error) throw new Error(error.message);
    }
  }

  // Sentiment for unanalyzed comments (bounded)
  const { data: pending } = await sb.from("implementing_act_feedback").select("id, feedback")
    .eq("implementing_act_id", act.id).is("analyzed_at", null).limit(MAX_SENTIMENT_PER_ACT);
  for (let i = 0; i < (pending ?? []).length; i += SENTIMENT_BATCH) {
    const batch = pending!.slice(i, i + SENTIMENT_BATCH);
    const input = JSON.stringify(batch.map((b: any) => ({ id: b.id, text: (b.feedback || "").slice(0, 1500) })));
    const out = await aiText(apiKey,
      "You classify public consultation feedback on an EU health data regulation. Comments may be in any language. For each item return its sentiment towards the proposed act: positive (supportive), neutral (mixed/technical), or negative (critical/opposed), with a score from -1 to 1. Respond ONLY with a JSON array: [{\"id\":number,\"sentiment\":\"positive|neutral|negative\",\"score\":number}].",
      input);
    const results: any[] = parseJson(out);
    const now = new Date().toISOString();
    for (const r of results) {
      if (!["positive", "neutral", "negative"].includes(r.sentiment)) continue;
      await sb.from("implementing_act_feedback").update({ sentiment: r.sentiment, sentiment_score: r.score, analyzed_at: now }).eq("id", r.id);
    }
  }

  // Aggregate
  const { data: all } = await sb.from("implementing_act_feedback")
    .select("feedback, sentiment, user_type, country").eq("implementing_act_id", act.id).limit(5000);
  const list = all ?? [];
  const sentiment_counts = { positive: 0, neutral: 0, negative: 0 } as Record<string, number>;
  for (const r of list) if (r.sentiment) sentiment_counts[r.sentiment]++;
  const analyzed = sentiment_counts.positive + sentiment_counts.neutral + sentiment_counts.negative;

  const { data: existing } = await sb.from("implementing_act_feedback_analysis").select("summary_comment_count").eq("implementing_act_id", act.id).maybeSingle();
  const update: Record<string, unknown> = {
    implementing_act_id: act.id,
    initiative_id: initiativeId,
    total_count: list.length,
    analyzed_count: analyzed,
    sentiment_counts,
    word_cloud: wordCloud(list.map((r: any) => r.feedback)),
    by_user_type: group(list, "user_type"),
    by_country: group(list, "country"),
    last_synced_at: new Date().toISOString(),
    status: "ready",
    last_error: null,
  };

  if (list.length > 0 && (existing?.summary_comment_count ?? 0) !== list.length) {
    const sample = list.slice(0, 120).map((r: any) => `[${r.user_type ?? "?"}/${r.country ?? "?"}/${r.sentiment ?? "?"}] ${(r.feedback || "").slice(0, 700)}`).join("\n---\n");
    const out = await aiText(apiKey,
      "Summarise public consultation feedback on an EU EHDS implementing act for a general audience, in English. Respond ONLY with JSON: {\"summary\":\"3-5 sentence neutral overview\",\"themes\":[{\"theme\":\"short title\",\"description\":\"1-2 sentences\",\"sentiment\":\"positive|neutral|negative\"}]} with 4-7 themes.",
      sample);
    const parsed = parseJson(out);
    update.themes_summary = parsed.summary ?? null;
    update.key_themes = Array.isArray(parsed.themes) ? parsed.themes : [];
    update.summary_comment_count = list.length;
  }
  await sb.from("implementing_act_feedback_analysis").upsert(update);
  return { id: act.id, comments: list.length, analyzed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "AI key not configured" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const actId = typeof body.implementingActId === "string" ? body.implementingActId.slice(0, 100) : null;
  const scheduled = body.scheduled === true;

  // Manual runs require an admin/editor
  let isAdmin = false;
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (token) {
    const { data } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!).auth.getUser(token);
    if (data?.user) {
      const { data: ok } = await sb.rpc("is_admin_or_editor", { _user_id: data.user.id });
      isAdmin = !!ok;
    }
  }
  if (!scheduled && !isAdmin) return json({ error: "Forbidden" }, 403);

  // Single-flight lock; scheduled runs at most once per 20h
  const { data: lock } = await sb.from("feedback_sync_lock").select("*").eq("id", "act-feedback").single();
  const now = Date.now();
  if (lock && new Date(lock.locked_until).getTime() > now) return json({ error: "A sync is already running, try again shortly." }, 409);
  if (scheduled && lock?.last_run_at && now - new Date(lock.last_run_at).getTime() < 20 * 3600_000) return json({ skipped: "ran recently" });
  if (scheduled && lock?.paused_reason) return json({ skipped: `paused: ${lock.paused_reason}` });
  await sb.from("feedback_sync_lock").update({ locked_until: new Date(now + 10 * 60_000).toISOString(), ...(isAdmin ? { paused_reason: null } : {}) }).eq("id", "act-feedback");

  const results: any[] = [];
  try {
    let q = sb.from("implementing_acts").select("id, feedback_link, official_link, status");
    q = actId ? q.eq("id", actId) : q.or("feedback_link.ilike.%initiatives/%,official_link.ilike.%initiatives/%");
    const { data: acts } = await q;
    for (const act of acts ?? []) {
      try {
        results.push(await processAct(sb, apiKey, act));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await sb.from("implementing_act_feedback_analysis").upsert({ implementing_act_id: act.id, status: "error", last_error: msg.slice(0, 500) });
        results.push({ id: act.id, error: msg });
        if (e instanceof AiStop && [402, 403, 429].includes(e.status)) {
          if (e.status !== 429) await sb.from("feedback_sync_lock").update({ paused_reason: msg.slice(0, 300) }).eq("id", "act-feedback");
          break; // circuit breaker
        }
      }
    }
  } finally {
    await sb.from("feedback_sync_lock").update({ locked_until: new Date().toISOString(), last_run_at: new Date().toISOString() }).eq("id", "act-feedback");
  }
  return json({ success: true, results });
});
