import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Remaining-Uses, X-Daily-Limit, X-RateLimit-Remaining",
};

const DAILY_LIMIT = 30;
const IP_RATE_LIMIT_PER_HOUR = 5;
const IP_RATE_LIMIT_WINDOW_MS = 3600000;

// Fallback prompts (used if DB prompts not available)
const FALLBACK_ROLE_PROMPTS: Record<string, string> = {
  general: `USER ROLE: General User\nFocus on providing balanced, accessible explanations.`,
  healthcare: `USER ROLE: Healthcare Professional\nFocus on clinical implications and patient rights under EHDS.`,
  legal: `USER ROLE: Legal/Compliance Officer\nFocus on legal obligations and compliance requirements.`,
  researcher: `USER ROLE: Researcher\nFocus on secondary use of health data for research purposes.`,
  developer: `USER ROLE: Health Tech Developer\nFocus on technical implementation requirements.`,
  policy: `USER ROLE: Policy Maker\nFocus on governance structures and implementation strategy.`,
};

const FALLBACK_LEVEL_PROMPTS: Record<string, string> = {
  expert: `EXPLANATION LEVEL: Expert\nUse precise legal and technical terminology.`,
  professional: `EXPLANATION LEVEL: Professional\nUse clear professional language.`,
  student: `EXPLANATION LEVEL: Student\nUse an educational tone.`,
  beginner: `EXPLANATION LEVEL: Complete Beginner\nUse simple, everyday language.`,
};

function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();
  return "unknown";
}

async function checkIpRateLimit(
  supabase: any,
  ipAddress: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - IP_RATE_LIMIT_WINDOW_MS).toISOString();
  const identifier = `ai-assistant:${ipAddress}`;

  const { data: existing, error: selectError } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("ip_address", identifier)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    console.error("IP rate limit check error:", selectError);
    return { allowed: true, remaining: IP_RATE_LIMIT_PER_HOUR };
  }

  if (existing) {
    if (existing.request_count >= IP_RATE_LIMIT_PER_HOUR) {
      return { allowed: false, remaining: 0 };
    }
    await supabase
      .from("api_rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("id", existing.id);
    return { allowed: true, remaining: IP_RATE_LIMIT_PER_HOUR - existing.request_count - 1 };
  }

  await supabase.from("api_rate_limits").insert({
    ip_address: identifier,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: IP_RATE_LIMIT_PER_HOUR - 1 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let benchmarkData: any = {
    model_used: "unknown",
    role_used: "general",
    explain_level: "professional",
    error_occurred: false,
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIp = getClientIp(req);
    benchmarkData.ip_address = clientIp;

    const ipRateLimit = await checkIpRateLimit(supabase, clientIp);
    if (!ipRateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: "You've reached the hourly limit. Please try again later.",
        remaining: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": "0" },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    let { data: usageData, error: usageError } = await supabase
      .from("ai_daily_usage")
      .select("*")
      .eq("usage_date", today)
      .single();

    if (usageError && usageError.code === 'PGRST116') {
      const { data: newUsage, error: insertError } = await supabase
        .from("ai_daily_usage")
        .insert({ usage_date: today, request_count: 0, daily_limit: DAILY_LIMIT })
        .select()
        .single();
      if (insertError) throw new Error("Failed to initialize usage tracking");
      usageData = newUsage;
    } else if (usageError) {
      throw new Error("Failed to check usage limits");
    }

    if (usageData.request_count >= usageData.daily_limit) {
      return new Response(JSON.stringify({ 
        error: "Daily limit reached. The AI assistant will be available again tomorrow.",
        remaining: 0, limit: usageData.daily_limit
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, role = 'general', explainLevel = 'professional' } = body;
    benchmarkData.role_used = role;
    benchmarkData.explain_level = explainLevel;

    const VALID_ROLES = ['general', 'healthcare', 'legal', 'researcher', 'developer', 'policy'];
    const VALID_LEVELS = ['expert', 'professional', 'student', 'beginner'];
    const MAX_MESSAGES = 50;
    const MAX_MESSAGE_LENGTH = 10000;

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Invalid request: messages array must have 1-${MAX_MESSAGES} items` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') {
        return new Response(JSON.stringify({ error: "Invalid request: each message must be an object" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid request: message role must be 'user', 'assistant', or 'system'" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ error: `Invalid request: message content must be a string with max ${MAX_MESSAGE_LENGTH} characters` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (!VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role: must be one of ${VALID_ROLES.join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!VALID_LEVELS.includes(explainLevel)) {
      return new Response(JSON.stringify({ error: `Invalid explainLevel: must be one of ${VALID_LEVELS.join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user query preview for benchmarking
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    benchmarkData.user_query_preview = lastUserMsg?.content?.substring(0, 200) || '';

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch prompts from DB and content in parallel
    const [promptsRes, articlesRes, recitalsRes, definitionsRes, chaptersRes, implementingActsRes, faqsRes, ehdsFaqsRes, iaArticlesRes, iaRecitalsRes, iaSectionsRes] = await Promise.all([
      supabase.from("ai_prompt_config").select("prompt_key, prompt_text, category").eq("is_active", true).order("sort_order"),
      supabase.from("articles").select("article_number, title, content").order("article_number"),
      supabase.from("recitals").select("recital_number, content, related_articles").order("recital_number"),
      supabase.from("definitions").select("term, definition, source_article").order("term"),
      supabase.from("chapters").select("chapter_number, title, description").order("chapter_number"),
      supabase.from("implementing_acts").select("id, title, description, status, article_reference, type, theme, feedback_deadline, feedback_link"),
      supabase.from("help_center_faq").select("question, answer, category").eq("is_published", true).order("sort_order"),
      supabase.from("ehds_faqs").select("faq_number, question, answer, rich_content, chapter, source_articles, source_references").eq("is_published", true).order("faq_number"),
      supabase.from("implementing_act_articles").select("implementing_act_id, article_number, title, content").order("article_number"),
      supabase.from("implementing_act_recitals").select("implementing_act_id, recital_number, content").order("recital_number"),
      supabase.from("implementing_act_sections").select("implementing_act_id, section_number, title").order("section_number"),
    ]);

    // Build prompt maps from DB
    const dbPrompts = promptsRes.data || [];
    const promptMap: Record<string, string> = {};
    for (const p of dbPrompts) {
      promptMap[p.prompt_key] = p.prompt_text;
    }

    // Resolve role and level prompts (DB first, fallback second)
    const roleKey = `role_${role}`;
    const levelKey = `level_${explainLevel}`;
    const rolePrompt = promptMap[roleKey] || FALLBACK_ROLE_PROMPTS[role] || FALLBACK_ROLE_PROMPTS.general;
    const levelPrompt = promptMap[levelKey] || FALLBACK_LEVEL_PROMPTS[explainLevel] || FALLBACK_LEVEL_PROMPTS.professional;
    const systemBase = promptMap['system'] || 'You are an expert AI assistant EXCLUSIVELY for the European Health Data Space (EHDS) Regulation (EU) 2025/327.';

    const articles = articlesRes.data || [];
    const recitals = recitalsRes.data || [];
    const definitions = definitionsRes.data || [];
    const chapters = chaptersRes.data || [];
    const implementingActs = implementingActsRes.data || [];
    const faqs = faqsRes.data || [];
    const ehdsFaqs = ehdsFaqsRes.data || [];
    const iaArticles = iaArticlesRes.data || [];
    const iaRecitals = iaRecitalsRes.data || [];
    const iaSections = iaSectionsRes.data || [];

    const articlesSummary = articles.map(a => 
      `Article ${a.article_number}: ${a.title}\n${a.content.substring(0, 500)}${a.content.length > 500 ? '...' : ''}`
    ).join("\n\n");
    const definitionsList = definitions.map(d => `"${d.term}": ${d.definition}`).join("\n");
    const chaptersList = chapters.map(c => `Chapter ${c.chapter_number}: ${c.title}${c.description ? ` - ${c.description}` : ''}`).join("\n");
    const implementingActsList = implementingActs.map(ia => {
      let entry = `${ia.id}: ${ia.title} (Status: ${ia.status}) - ${ia.type}, Theme: ${ia.theme}, Reference: ${ia.article_reference}`;
      if (ia.feedback_deadline) entry += `, Feedback period: ${ia.feedback_deadline}`;
      if (ia.feedback_link) entry += `, Feedback: ${ia.feedback_link}`;
      return entry;
    }).join("\n");
    const recitalsSummary = recitals.slice(0, 50).map(r => `Recital (${r.recital_number}): ${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}`).join("\n\n");
    const faqsList = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    const officialFaqsList = ehdsFaqs.map(f => 
      `FAQ #${f.faq_number} [Chapter: ${f.chapter}]: ${f.question}\nOFFICIAL ANSWER: ${f.rich_content || f.answer}\nSource articles: ${(f.source_articles || []).join(', ')}\n${f.source_references || ''}`
    ).join("\n\n---\n\n");

    // Build detailed implementing act content grouped by act
    const iaContentByAct: Record<string, { sections: any[]; articles: any[]; recitals: any[] }> = {};
    for (const ia of implementingActs) {
      iaContentByAct[ia.id] = { sections: [], articles: [], recitals: [] };
    }
    for (const s of iaSections) {
      if (iaContentByAct[s.implementing_act_id]) iaContentByAct[s.implementing_act_id].sections.push(s);
    }
    for (const a of iaArticles) {
      if (iaContentByAct[a.implementing_act_id]) iaContentByAct[a.implementing_act_id].articles.push(a);
    }
    for (const r of iaRecitals) {
      if (iaContentByAct[r.implementing_act_id]) iaContentByAct[r.implementing_act_id].recitals.push(r);
    }

    // Only include detailed content for acts that have articles/recitals
    const iaDetailedContent = implementingActs
      .filter(ia => {
        const c = iaContentByAct[ia.id];
        return c && (c.articles.length > 0 || c.recitals.length > 0);
      })
      .map(ia => {
        const c = iaContentByAct[ia.id];
        let block = `\n### Implementing Act: ${ia.title} (${ia.id})\nStatus: ${ia.status} | Reference: ${ia.article_reference}\n${ia.description || ''}\n`;
        if (c.sections.length > 0) {
          block += `\nSections:\n${c.sections.map(s => `  Chapter/Section ${s.section_number}: ${s.title}`).join('\n')}\n`;
        }
        if (c.recitals.length > 0) {
          block += `\nRecitals:\n${c.recitals.map(r => `  Recital (${r.recital_number}): ${r.content.substring(0, 400)}${r.content.length > 400 ? '...' : ''}`).join('\n')}\n`;
        }
        if (c.articles.length > 0) {
          block += `\nArticles:\n${c.articles.map(a => `  Article ${a.article_number}: ${a.title}\n  ${a.content.substring(0, 600)}${a.content.length > 600 ? '...' : ''}`).join('\n\n')}\n`;
        }
        return block;
      }).join("\n---\n");

    const systemPrompt = `${systemBase}

${rolePrompt}
${levelPrompt}

STRICT TOPIC BOUNDARIES:
- You MUST ONLY answer questions directly related to the EHDS Regulation, its articles, recitals, definitions, chapters, annexes, and implementing acts.
- If a user asks about anything unrelated to EHDS, politely decline and redirect them.

CRITICAL — FAQ-FIRST RESPONSE STRATEGY:
You have access to ${ehdsFaqs.length} official European Commission FAQ answers below. These are the AUTHORITATIVE answers from DG SANTE.
**BEFORE composing your own answer, ALWAYS scan the OFFICIAL EHDS FAQ BANK for a matching or related question.**
- If a matching FAQ exists: use the official FAQ answer as the PRIMARY basis of your response. Cite the FAQ number with a link.
- If multiple FAQs are relevant: synthesize them and cite all relevant FAQ numbers.
- If no FAQ matches: use the regulation articles, recitals, and definitions.
- NEVER contradict the official FAQ answers.

RESPONSE GUIDELINES:
1. Only answer questions based on the EHDS regulation content provided below
2. If you don't know or the information isn't in the regulation, say so clearly
3. **ALWAYS include source citations** at the end in a "Sources" section
4. Keep answers concise but comprehensive
5. Adapt language complexity based on the explanation level setting

CITATION FORMAT:
- For FAQs: [FAQ #N](/faq/N)
- For articles: [Article X](/article/X)
- For recitals: [Recital Y](/recital/Y)
- For implementing acts: [Act Title](/implementing-acts/ID)
- Always list sources under "**Sources:**"

EHDS REGULATION STRUCTURE:
${chaptersList}

KEY DEFINITIONS (Article 2):
${definitionsList}

ARTICLES CONTENT:
${articlesSummary}

RECITALS (Background/Intent):
${recitalsSummary}

IMPLEMENTING ACTS STATUS:
${implementingActsList}
${iaDetailedContent ? `\n=== IMPLEMENTING ACTS DETAILED CONTENT ===\nThe following implementing acts have full article and recital text available. Use this content to answer detailed questions about specific implementing act provisions.\n${iaDetailedContent}\n=== END IMPLEMENTING ACTS CONTENT ===` : ''}

PLATFORM HELP CENTRE FAQs:
${faqsList}

=== OFFICIAL EHDS FAQ BANK ===
(${ehdsFaqs.length} detailed Q&As from European Commission, DG SANTE Unit C.1)
${officialFaqsList}
=== END OFFICIAL FAQ BANK ===

RESPONSE CHECKLIST:
1. Check the Official EHDS FAQ Bank for a matching question
2. If found: base your answer on the FAQ content, cite [FAQ #N](/faq/N)
3. Supplement with relevant articles and recitals
4. For implementing act questions: use the detailed implementing act content above
5. End with a **Sources:** section`;

    // Fetch configured AI model
    let aiModel = "google/gemini-2.5-flash";
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("ai_model")
      .eq("id", "default")
      .single();
    if (siteSettings?.ai_model) aiModel = siteSettings.ai_model;
    benchmarkData.model_used = aiModel;

    console.log("Calling AI gateway with model:", aiModel, "Role:", role, "Level:", explainLevel);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      benchmarkData.error_occurred = true;
      benchmarkData.error_message = `HTTP ${response.status}`;
      benchmarkData.response_time_ms = Date.now() - startTime;
      
      // Record benchmark even on error
      await supabase.from("ai_assistant_benchmarks").insert(benchmarkData).then(() => {});

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update usage count
    await supabase
      .from("ai_daily_usage")
      .update({ request_count: usageData.request_count + 1 })
      .eq("usage_date", today);

    // Record successful benchmark
    benchmarkData.response_time_ms = Date.now() - startTime;
    supabase.from("ai_assistant_benchmarks").insert(benchmarkData).then(() => {});

    console.log("Streaming response... Usage:", usageData.request_count + 1, "/", usageData.daily_limit);
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "X-Remaining-Uses": String(usageData.daily_limit - usageData.request_count - 1),
        "X-Daily-Limit": String(usageData.daily_limit)
      },
    });
  } catch (e) {
    console.error("EHDS assistant error:", e);
    
    // Try to record error benchmark
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseServiceKey);
      benchmarkData.error_occurred = true;
      benchmarkData.error_message = e instanceof Error ? e.message : "Unknown error";
      benchmarkData.response_time_ms = Date.now() - startTime;
      await sb.from("ai_assistant_benchmarks").insert(benchmarkData);
    } catch {} // Don't fail on benchmark recording

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
