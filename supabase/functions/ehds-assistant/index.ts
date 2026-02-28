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

// Role-specific prompt additions
const ROLE_PROMPTS: Record<string, string> = {
  general: `
USER ROLE: General User
Focus on providing balanced, accessible explanations that cover the key points without assuming specialized knowledge. Use everyday language while maintaining accuracy. Provide practical examples when helpful.`,
  healthcare: `
USER ROLE: Healthcare Professional
Focus on clinical implications, patient rights under EHDS, and how the regulation affects healthcare delivery. Emphasize:
- Primary use of health data (Articles 3-14)
- Patient access rights and control mechanisms
- EHR system requirements and interoperability
- MyHealth@EU cross-border data exchange
- Data quality requirements for clinical use
- Obligations for healthcare providers and data holders
Use medical/clinical terminology where appropriate.`,
  legal: `
USER ROLE: Legal/Compliance Officer
Focus on legal obligations, compliance requirements, and regulatory framework. Emphasize:
- Specific obligations for different actors (manufacturers, data holders, data users)
- Penalties and enforcement mechanisms
- Relationship with GDPR and other EU regulations
- Data governance and accountability requirements
- Contractual and procedural requirements
- Timeline for compliance and transitional provisions
- Legal basis for data processing under primary and secondary use
Cite specific articles and legal provisions precisely.`,
  researcher: `
USER ROLE: Researcher
Focus on secondary use of health data for research purposes. Emphasize:
- Chapter IV provisions on secondary use (Articles 33-50)
- Health data access body procedures and requirements
- Data permit application process
- Eligible purposes for secondary use (Article 34)
- Data minimization and secure processing environments
- Cross-border research collaboration through HealthData@EU
- Publication and result sharing requirements
- Fees and access timelines
Explain processes in practical, actionable terms.`,
  developer: `
USER ROLE: Health Tech Developer
Focus on technical implementation requirements. Emphasize:
- EHR system essential requirements (Article 6, Annex II)
- EU self-declaration and conformity assessment procedures
- Interoperability requirements and European EHR exchange format
- API and data exchange standards
- Certification and market surveillance
- Cybersecurity and logging requirements
- Wellness application voluntary labeling
- Integration with existing health IT infrastructure
Use technical terminology and reference specific technical annexes.`,
  policy: `
USER ROLE: Policy Maker
Focus on governance structures and implementation strategy. Emphasize:
- EHDS Board composition and responsibilities
- National digital health authority roles
- Cross-border cooperation mechanisms (MyHealth@EU, HealthData@EU)
- Implementation timeline and key milestones
- Member State obligations and flexibility
- Relationship with national health systems
- Funding and resource requirements
- Monitoring and evaluation frameworks
- Delegated and implementing acts timeline
Provide strategic, high-level perspective while connecting to specific provisions.`
};

const EXPLAIN_LEVEL_PROMPTS: Record<string, string> = {
  expert: `
EXPLANATION LEVEL: Expert
Use precise legal and technical terminology without simplification. Assume deep familiarity with EU regulatory framework, health data governance, and legal concepts. Reference specific articles, recitals, and annexes with minimal context. Focus on nuances, exceptions, and edge cases.`,
  professional: `
EXPLANATION LEVEL: Professional
Use clear professional language with appropriate technical terms. Provide context for legal references. Balance detail with accessibility. Include practical implications alongside regulatory text. Assume working knowledge of the healthcare or legal sector.`,
  student: `
EXPLANATION LEVEL: Student
Use an educational tone that builds understanding step by step. Define technical and legal terms when first introduced. Include concrete examples to illustrate abstract concepts. Explain the "why" behind provisions, not just the "what". Connect concepts to real-world scenarios students might encounter.`,
  beginner: `
EXPLANATION LEVEL: Complete Beginner
Use simple, everyday language. Avoid jargon or define all terms clearly. Use analogies and relatable examples extensively. Break complex concepts into small, digestible pieces. Focus on the big picture before details. Use phrases like "In simple terms..." or "Think of it like...". Make no assumptions about prior knowledge of EU law or health data governance.`
};

function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    return ips[0];
  }

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

    return {
      allowed: true,
      remaining: IP_RATE_LIMIT_PER_HOUR - existing.request_count - 1,
    };
  }

  const { error: insertError } = await supabase.from("api_rate_limits").insert({
    ip_address: identifier,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  if (insertError) {
    console.error("IP rate limit insert error:", insertError);
  }

  return { allowed: true, remaining: IP_RATE_LIMIT_PER_HOUR - 1 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIp = getClientIp(req);
    console.log("Processing AI assistant request from IP:", clientIp);

    const ipRateLimit = await checkIpRateLimit(supabase, clientIp);
    
    if (!ipRateLimit.allowed) {
      console.log("IP rate limit exceeded for:", clientIp);
      return new Response(JSON.stringify({ 
        error: "You've reached the hourly limit. Please try again later.",
        remaining: 0
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0"
        },
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
      
      if (insertError) {
        console.error("Error creating usage record:", insertError);
        throw new Error("Failed to initialize usage tracking");
      }
      usageData = newUsage;
    } else if (usageError) {
      console.error("Error fetching usage:", usageError);
      throw new Error("Failed to check usage limits");
    }

    if (usageData.request_count >= usageData.daily_limit) {
      console.log("Daily limit exceeded:", usageData.request_count, "/", usageData.daily_limit);
      return new Response(JSON.stringify({ 
        error: "Daily limit reached. The AI assistant will be available again tomorrow.",
        remaining: 0,
        limit: usageData.daily_limit
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, role = 'general', explainLevel = 'professional' } = body;
    
    // Input validation
    const VALID_ROLES = ['general', 'healthcare', 'legal', 'researcher', 'developer', 'policy'];
    const VALID_LEVELS = ['expert', 'professional', 'student', 'beginner'];
    const MAX_MESSAGES = 50;
    const MAX_MESSAGE_LENGTH = 10000;
    
    // Validate messages array
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ 
        error: "Invalid request: messages must be an array" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ 
        error: `Invalid request: messages array must have 1-${MAX_MESSAGES} items` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate each message format and length
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') {
        return new Response(JSON.stringify({ 
          error: "Invalid request: each message must be an object" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(JSON.stringify({ 
          error: "Invalid request: message role must be 'user', 'assistant', or 'system'" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ 
          error: `Invalid request: message content must be a string with max ${MAX_MESSAGE_LENGTH} characters` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // Validate role parameter
    if (!VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ 
        error: `Invalid role: must be one of ${VALID_ROLES.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate explainLevel parameter
    if (!VALID_LEVELS.includes(explainLevel)) {
      return new Response(JSON.stringify({ 
        error: `Invalid explainLevel: must be one of ${VALID_LEVELS.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Fetching EHDS content for context... Role:", role, "Level:", explainLevel);
    
    const [articlesRes, recitalsRes, definitionsRes, chaptersRes, implementingActsRes] = await Promise.all([
      supabase.from("articles").select("article_number, title, content").order("article_number"),
      supabase.from("recitals").select("recital_number, content, related_articles").order("recital_number"),
      supabase.from("definitions").select("term, definition, source_article").order("term"),
      supabase.from("chapters").select("chapter_number, title, description").order("chapter_number"),
      supabase.from("implementing_acts").select("id, title, description, status, article_reference, type, theme"),
    ]);

    const articles = articlesRes.data || [];
    const recitals = recitalsRes.data || [];
    const definitions = definitionsRes.data || [];
    const chapters = chaptersRes.data || [];
    const implementingActs = implementingActsRes.data || [];

    const articlesSummary = articles.map(a => 
      `Article ${a.article_number}: ${a.title}\n${a.content.substring(0, 500)}${a.content.length > 500 ? '...' : ''}`
    ).join("\n\n");

    const definitionsList = definitions.map(d => 
      `"${d.term}": ${d.definition}`
    ).join("\n");

    const chaptersList = chapters.map(c => 
      `Chapter ${c.chapter_number}: ${c.title}${c.description ? ` - ${c.description}` : ''}`
    ).join("\n");

    const implementingActsList = implementingActs.map(ia => 
      `${ia.id}: ${ia.title} (${ia.status}) - ${ia.type}, Theme: ${ia.theme}, Reference: ${ia.article_reference}`
    ).join("\n");

    const recitalsSummary = recitals.slice(0, 50).map(r => 
      `Recital (${r.recital_number}): ${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}`
    ).join("\n\n");

    // Get role and level specific prompts
    const rolePrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.general;
    const levelPrompt = EXPLAIN_LEVEL_PROMPTS[explainLevel] || EXPLAIN_LEVEL_PROMPTS.professional;

    const systemPrompt = `You are an expert AI assistant EXCLUSIVELY for the European Health Data Space (EHDS) Regulation (EU) 2025/327. Your ONLY purpose is to help users understand and navigate this specific regulation.

${rolePrompt}
${levelPrompt}

STRICT TOPIC BOUNDARIES:
- You MUST ONLY answer questions directly related to the EHDS Regulation, its articles, recitals, definitions, chapters, annexes, and implementing acts.
- If a user asks about anything unrelated to EHDS (general health questions, other regulations, coding help, general knowledge, etc.), politely decline and redirect them to ask about the EHDS Regulation instead.
- Example refusal: "I'm specifically designed to help with the EHDS Regulation (EU) 2025/327. I can't assist with that topic, but I'd be happy to help you understand any aspect of the European Health Data Space regulation. What would you like to know about EHDS?"

RESPONSE GUIDELINES:
1. Only answer questions based on the EHDS regulation content provided below
2. If you don't know or the information isn't in the regulation, say so clearly
3. **ALWAYS include source citations** at the end of your response in a "Sources" section
4. Use the format: "**Sources:** Article X, Recital Y, Definition: Z" with clickable references
5. Provide clear, accurate information without speculation
6. For navigation requests, guide users to the relevant articles or sections
7. Keep answers concise but comprehensive
8. Use plain language while maintaining legal accuracy
9. Adapt your language complexity based on the explanation level setting

CITATION FORMAT:
- For articles: [Article X](/articles/X)
- For recitals: [Recital Y](/recitals/Y)
- For definitions: reference by term name
- For implementing acts: reference by title
- Always list sources at the end under "**Sources:**"

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

When users ask about specific topics, reference the most relevant articles and explain how they apply. For navigation requests, provide direct references to articles, chapters, or definitions that address their query. Always end your response with a Sources section listing the specific articles, recitals, or definitions you referenced.`;

    // Fetch configured AI model from site settings
    let aiModel = "google/gemini-2.5-flash";
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("ai_model")
      .eq("id", "default")
      .single();
    if (siteSettings?.ai_model) {
      aiModel = siteSettings.ai_model;
    }

    console.log("Calling Lovable AI gateway with model:", aiModel);

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
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabase
      .from("ai_daily_usage")
      .update({ request_count: usageData.request_count + 1 })
      .eq("usage_date", today);

    if (updateError) {
      console.error("Error updating usage count:", updateError);
    }

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
