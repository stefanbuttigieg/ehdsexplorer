/**
 * Emoji symbol mappings for EHDS terms to make games kid-friendly.
 * When Kids Mode is active, terms are shown with associated emoji icons
 * and definitions are simplified with bigger text.
 */

// Map common EHDS keywords to kid-friendly emoji
const TERM_EMOJI_MAP: Record<string, string> = {
  // Data & records
  "electronic health record": "📋",
  "health data": "💊",
  "personal health data": "🔒",
  "electronic health data": "💻",
  "health record": "📋",
  "patient summary": "📝",
  "ePrescription": "💊",
  "e-prescription": "💊",
  "prescription": "💊",
  "laboratory": "🔬",
  "medical image": "🩻",
  "discharge report": "📄",
  "hospital discharge": "🏥",

  // Bodies & authorities
  "digital health authority": "🏛️",
  "health data access body": "🔑",
  "EHDS Board": "🇪🇺",
  "Member State": "🏳️",
  "data holder": "🗄️",
  "data user": "👤",
  "natural person": "🧑",
  "data subject": "🧑",
  "health professional": "👨‍⚕️",
  "healthcare provider": "🏥",
  "manufacturer": "🏭",

  // Concepts
  "interoperability": "🔗",
  "consent": "✅",
  "anonymisation": "🎭",
  "pseudonymisation": "🔢",
  "secondary use": "🔬",
  "primary use": "🩺",
  "data permit": "📜",
  "data request": "📨",
  "secure processing environment": "🔐",
  "data quality": "⭐",
  "telemedicine": "📱",
  "telehealth": "📱",
  "wellness application": "📲",
  "EHR system": "🖥️",
  "MyHealth@EU": "🌍",
  "HealthData@EU": "🌐",
  "certification": "✅",
  "conformity assessment": "🔍",
  "labelling": "🏷️",
  "registration": "📝",
  "cross-border": "✈️",
  "portability": "🧳",

  // Rights
  "right of access": "👁️",
  "right to rectification": "✏️",
  "right to restriction": "🚫",
  "data protection": "🛡️",
  "transparency": "🔎",
  "complaint": "📢",

  // Research & innovation
  "clinical trial": "🧪",
  "research": "🔬",
  "public health": "🌡️",
  "statistics": "📊",
  "innovation": "💡",
  "artificial intelligence": "🤖",
  "AI": "🤖",
  "algorithm": "⚙️",
};

/**
 * Find the best matching emoji for a given EHDS term.
 */
export function getTermEmoji(term: string): string {
  const lowerTerm = term.toLowerCase();

  // Exact match first
  if (TERM_EMOJI_MAP[lowerTerm]) return TERM_EMOJI_MAP[lowerTerm];

  // Partial match — find the longest keyword that appears in the term
  let bestMatch = "";
  let bestEmoji = "📖"; // default fallback

  for (const [keyword, emoji] of Object.entries(TERM_EMOJI_MAP)) {
    if (lowerTerm.includes(keyword) && keyword.length > bestMatch.length) {
      bestMatch = keyword;
      bestEmoji = emoji;
    }
  }

  return bestEmoji;
}

/**
 * Simplify a definition for kids (truncate at a shorter length, use simpler language cue).
 */
export function simplifyDefinition(definition: string, maxLength = 60): string {
  if (definition.length <= maxLength) return definition;
  // Try to break at a word boundary
  const truncated = definition.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + "…";
}
