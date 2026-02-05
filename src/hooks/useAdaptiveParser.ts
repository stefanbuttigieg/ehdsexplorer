import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === Types ===
export interface ParsedArticle {
  articleNumber: number;
  title: string;
  content: string;
  chapterNumber?: number;
}

export interface ParsedRecital {
  recitalNumber: number;
  content: string;
}

export interface ParsedDefinition {
  definitionNumber: number;
  term: string;
  definition: string;
}

export interface ParsedAnnex {
  annexNumber: number;
  romanNumeral: string;
  title: string;
  content: string;
}

export interface ParsedFootnote {
  marker: string;
  content: string;
}

export interface ParsedContent {
  articles: ParsedArticle[];
  recitals: ParsedRecital[];
  definitions: ParsedDefinition[];
  annexes: ParsedAnnex[];
  footnotes: ParsedFootnote[];
  detectedLanguage: string;
}

export interface PatternConfig {
  recitalTablePattern?: string;
  articleHeaderPattern?: string;
  recitalMarkerPattern?: string;
  footnotePattern?: string;
  adoptionMarker?: string;
  annexPattern?: string;
}

// === Language-specific patterns ===
const ARTICLE_PATTERNS: Record<string, RegExp> = {
  en: /^Article\s+(\d+)/i,
  de: /^Artikel\s+(\d+)/i,
  fr: /^Article\s+(\d+)/i,
  es: /^Artículo\s+(\d+)/i,
  it: /^Articolo\s+(\d+)/i,
  pt: /^Artigo\s+(\d+)/i,
  nl: /^Artikel\s+(\d+)/i,
  pl: /^Artykuł\s+(\d+)/i,
  cs: /^Článek\s+(\d+)/i,
  sk: /^Článok\s+(\d+)/i,
  hu: /^(\d+)\.\s*cikk/i,
  ro: /^Articolul\s+(\d+)/i,
  bg: /^Член\s+(\d+)/i,
  el: /^Άρθρο\s+(\d+)/i,
  sv: /^Artikel\s+(\d+)/i,
  da: /^Artikel\s+(\d+)/i,
  fi: /^(\d+)\s*artikla/i,
  et: /^Artikkel\s+(\d+)/i,
  lv: /^(\d+)\.\s*pants/i,
  lt: /^(\d+)\s*straipsnis/i,
  sl: /^(\d+)\.\s*člen/i,
  hr: /^Članak\s+(\d+)/i,
  mt: /^Artikolu\s+(\d+)/i,
  ga: /^Airteagal\s+(\d+)/i,
};

const CHAPTER_PATTERNS: Record<string, RegExp> = {
  en: /^CHAPTER\s+([IVXLCDM]+)/i,
  de: /^KAPITEL\s+([IVXLCDM]+)/i,
  fr: /^CHAPITRE\s+([IVXLCDM]+)/i,
  es: /^CAPÍTULO\s+([IVXLCDM]+)/i,
  it: /^CAPO\s+([IVXLCDM]+)/i,
  pt: /^CAPÍTULO\s+([IVXLCDM]+)/i,
  nl: /^HOOFDSTUK\s+([IVXLCDM]+)/i,
  pl: /^ROZDZIAŁ\s+([IVXLCDM]+)/i,
  cs: /^KAPITOLA\s+([IVXLCDM]+)/i,
  sk: /^KAPITOLA\s+([IVXLCDM]+)/i,
  hu: /^([IVXLCDM]+)\.\s*FEJEZET/i,
  ro: /^CAPITOLUL\s+([IVXLCDM]+)/i,
  bg: /^ГЛАВА\s+([IVXLCDM]+)/i,
  el: /^ΚΕΦΑΛΑΙΟ\s+([IVXLCDM]+)/i,
  sv: /^KAPITEL\s+([IVXLCDM]+)/i,
  da: /^KAPITEL\s+([IVXLCDM]+)/i,
  fi: /^([IVXLCDM]+)\s*LUKU/i,
  et: /^([IVXLCDM]+)\s*PEATÜKK/i,
  lv: /^([IVXLCDM]+)\s*NODAĻA/i,
  lt: /^([IVXLCDM]+)\s*SKYRIUS/i,
  sl: /^([IVXLCDM]+)\.\s*POGLAVJE/i,
  hr: /^POGLAVLJE\s+([IVXLCDM]+)/i,
  mt: /^KAPITOLU\s+([IVXLCDM]+)/i,
  ga: /^CAIBIDIL\s+([IVXLCDM]+)/i,
};

const ANNEX_PATTERNS: Record<string, RegExp> = {
  en: /^ANNEX\s+([IVXLCDM]+)/i,
  de: /^ANHANG\s+([IVXLCDM]+)/i,
  fr: /^ANNEXE\s+([IVXLCDM]+)/i,
  es: /^ANEXO\s+([IVXLCDM]+)/i,
  it: /^ALLEGATO\s+([IVXLCDM]+)/i,
  pt: /^ANEXO\s+([IVXLCDM]+)/i,
  nl: /^BIJLAGE\s+([IVXLCDM]+)/i,
  pl: /^ZAŁĄCZNIK\s+([IVXLCDM]+)/i,
  cs: /^PŘÍLOHA\s+([IVXLCDM]+)/i,
  sk: /^PRÍLOHA\s+([IVXLCDM]+)/i,
  hu: /^([IVXLCDM]+)\.\s*MELLÉKLET/i,
  ro: /^ANEXA\s+([IVXLCDM]+)/i,
  bg: /^ПРИЛОЖЕНИЕ\s+([IVXLCDM]+)/i,
  el: /^ΠΑΡΑΡΤΗΜΑ\s+([IVXLCDM]+)/i,
  sv: /^BILAGA\s+([IVXLCDM]+)/i,
  da: /^BILAG\s+([IVXLCDM]+)/i,
  fi: /^LIITE\s+([IVXLCDM]+)/i,
  et: /^LISA\s+([IVXLCDM]+)/i,
  lv: /^([IVXLCDM]+)\.\s*PIELIKUMS/i,
  lt: /^([IVXLCDM]+)\s*PRIEDAS/i,
  sl: /^PRILOGA\s+([IVXLCDM]+)/i,
  hr: /^PRILOG\s+([IVXLCDM]+)/i,
  mt: /^ANNESS\s+([IVXLCDM]+)/i,
  ga: /^IARSCRÍBHINN\s+([IVXLCDM]+)/i,
};

const ADOPTION_MARKERS: RegExp[] = [
  /HAS ADOPTED THIS REGULATION/i,
  /HAT FOLGENDE VERORDNUNG ERLASSEN/i,
  /A ADOPTÉ LE PRÉSENT RÈGLEMENT/i,
  /HA ADOPTADO EL PRESENTE REGLAMENTO/i,
  /HA ADOTTATO IL PRESENTE REGOLAMENTO/i,
  /ADOTOU O PRESENTE REGULAMENTO/i,
  /HEEFT DE VOLGENDE VERORDENING VASTGESTELD/i,
  /PRZYJMUJE NINIEJSZE ROZPORZĄDZENIE/i,
  /PŘIJALA TOTO NAŘÍZENÍ/i,
  /PRIJALA TOTO NARIADENIE/i,
  /ELFOGADTA EZT A RENDELETET/i,
  /ADOPTĂ PREZENTUL REGULAMENT/i,
  /ПРИЕ НАСТОЯЩИЯ РЕГЛАМЕНТ/i,
  /ΕΞΕΔΩΣΕ ΤΟΝ ΠΑΡΟΝΤΑ ΚΑΝΟΝΙΣΜΟ/i,
  /HAR ANTAGIT DENNA FÖRORDNING/i,
  /HAR VEDTAGET DENNE FORORDNING/i,
  /ON ANTANUT TÄMÄN ASETUKSEN/i,
  /ON VASTU VÕTNUD KÄESOLEVA MÄÄRUSE/i,
  /IR PIEŅĒMUSI ŠO REGULU/i,
  /PRIĖMĖ ŠĮ REGLAMENTĄ/i,
  /JE SPREJELA NASLEDNJO UREDBO/i,
  /DONIJELI SU OVU UREDBU/i,
  /ADOTTAW DAN IR-REGOLAMENT/i,
  /TAR GHLAC AN RIALACHÁN SEO/i,
];

// === Helper functions ===
function romanToNumber(roman: string): number {
  const romanMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  const upper = roman.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const current = romanMap[upper[i]] || 0;
    const next = romanMap[upper[i + 1]] || 0;
    result += current < next ? -current : current;
  }
  return result;
}

// === Content Analysis - detects structure before parsing ===
export interface StructureAnalysis {
  hasMarkdownTables: boolean;
  tableFormat: 'two-column' | 'single-column' | 'none';
  recitalCount: number;
  articleCount: number;
  footnoteFormat: 'eurlex-link' | 'numbered-paren' | 'caret' | 'none';
  adoptionLineIndex: number;
  firstArticleIndex: number;
  firstAnnexIndex: number;
  detectedLanguage: string;
  sampleRecitals: Array<{ num: number; sample: string }>;
  sampleFootnotes: Array<{ marker: string; sample: string }>;
}

export function analyzeStructure(text: string): StructureAnalysis {
  const lines = text.split('\n');
  
  // Check for markdown tables
  const hasMarkdownTables = /^\|.*\|$/m.test(text);
  
  // Detect table format
  let tableFormat: 'two-column' | 'single-column' | 'none' = 'none';
  if (hasMarkdownTables) {
    const twoColumnRecital = /^\|\s*\((\d+)\)\s*\|/m.test(text);
    tableFormat = twoColumnRecital ? 'two-column' : 'single-column';
  }
  
  // Count recitals using different patterns
  const recitalMatches = text.match(/^\s*\((\d+)\)\s+/gm) || [];
  const tableRecitalMatches = text.match(/^\|\s*\((\d+)\)\s*\|/gm) || [];
  const recitalCount = Math.max(recitalMatches.length, tableRecitalMatches.length);
  
  // Count articles
  const articleMatches = text.match(/(?:^|\n)(?:Article|Artikel|Artículo|Articolo|Artigo|Artykuł|Článek|Článok|Articolul|Член|Άρθρο|Artikkel|Airteagal|Artikolu)\s+\d+/gi) || [];
  const articleCount = articleMatches.length;
  
  // Detect footnote format
  let footnoteFormat: 'eurlex-link' | 'numbered-paren' | 'caret' | 'none' = 'none';
  if (/\[\(\d+\)\]\([^)]*#ntr/.test(text)) {
    footnoteFormat = 'eurlex-link';
  } else if (/\[\^\d+\]/.test(text)) {
    footnoteFormat = 'caret';
  } else if (/\(\d+\)\s+OJ\s/i.test(text)) {
    footnoteFormat = 'numbered-paren';
  }
  
  // Find key boundaries
  let adoptionLineIndex = -1;
  let firstArticleIndex = -1;
  let firstAnnexIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (adoptionLineIndex === -1) {
      for (const marker of ADOPTION_MARKERS) {
        if (marker.test(line)) {
          adoptionLineIndex = i;
          break;
        }
      }
    }
    
    if (firstArticleIndex === -1) {
      for (const pattern of Object.values(ARTICLE_PATTERNS)) {
        if (pattern.test(line)) {
          firstArticleIndex = i;
          break;
        }
      }
    }
    
    if (firstAnnexIndex === -1) {
      for (const pattern of Object.values(ANNEX_PATTERNS)) {
        if (pattern.test(line)) {
          firstAnnexIndex = i;
          break;
        }
      }
    }
  }
  
  // Detect language
  let detectedLanguage = 'unknown';
  for (const [lang, pattern] of Object.entries(ARTICLE_PATTERNS)) {
    for (const line of lines.slice(0, 500)) {
      if (pattern.test(line.trim())) {
        detectedLanguage = lang;
        break;
      }
    }
    if (detectedLanguage !== 'unknown') break;
  }
  
  // Sample recitals for preview
  const sampleRecitals: Array<{ num: number; sample: string }> = [];
  if (tableFormat === 'two-column') {
    const matches = text.matchAll(/^\|\s*\((\d+)\)\s*\|\s*(.+?)\s*\|$/gm);
    for (const m of Array.from(matches).slice(0, 3)) {
      sampleRecitals.push({ num: parseInt(m[1]), sample: m[2].slice(0, 100) });
    }
  } else {
    const matches = text.matchAll(/^\s*\((\d+)\)\s+(.+)/gm);
    for (const m of Array.from(matches).slice(0, 3)) {
      sampleRecitals.push({ num: parseInt(m[1]), sample: m[2].slice(0, 100) });
    }
  }
  
  // Sample footnotes
  const sampleFootnotes: Array<{ marker: string; sample: string }> = [];
  if (footnoteFormat === 'numbered-paren') {
    const matches = text.matchAll(/^\((\d+)\)\s+(OJ\s.{0,50})/gm);
    for (const m of Array.from(matches).slice(0, 3)) {
      sampleFootnotes.push({ marker: m[1], sample: m[2] });
    }
  }
  
  return {
    hasMarkdownTables,
    tableFormat,
    recitalCount,
    articleCount,
    footnoteFormat,
    adoptionLineIndex,
    firstArticleIndex,
    firstAnnexIndex,
    detectedLanguage,
    sampleRecitals,
    sampleFootnotes,
  };
}

// === Adaptive Preprocessing ===
export function adaptivePreprocess(text: string, analysis: StructureAnalysis): string {
  let processed = text;
  
  // Step 1: Handle markdown tables based on detected format
  if (analysis.tableFormat === 'two-column') {
    // EUR-Lex table format for recitals: | (1) | content |
    processed = processed.replace(/^\|\s*\((\d+)\)\s*\|\s*(.+?)\s*\|$/gm, '\n($1) $2');
    
    // Also handle continued content in tables (no number in first cell)
    processed = processed.replace(/^\|\s*\|\s*(.+?)\s*\|$/gm, ' $1');
  }
  
  // Step 2: Remove table separators
  processed = processed.replace(/^\|[\s-:|]+\|$/gm, '');
  
  // Step 3: Handle multi-column tables generically
  processed = processed.replace(/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|$/gm, (_, c1, c2) => {
    const t1 = c1?.trim() || '';
    const t2 = c2?.trim() || '';
    if (!t1 && !t2) return '';
    if (!t1) return t2;
    if (!t2) return t1;
    return `${t1} ${t2}`;
  });
  
  // Step 4: Clean remaining pipe characters
  processed = processed.replace(/^\s*\|\s*/gm, '');
  processed = processed.replace(/\s*\|\s*$/gm, '');
  
  // Step 5: Normalize footnotes based on detected format
  if (analysis.footnoteFormat === 'eurlex-link') {
    // Convert EUR-Lex footnote links: [(1)](url#ntr1-...) -> [^1]
    processed = processed.replace(/\[\((\d+)\)\]\([^)]*#ntr\d+-[^)]+\)/g, '[^$1]');
  }
  
  // Step 6: Clean markdown links but keep text
  processed = processed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Step 7: Remove images
  processed = processed.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Step 8: Clean HTML tags
  processed = processed.replace(/<br\s*\/?>/gi, '\n');
  processed = processed.replace(/<[^>]+>/g, '');
  
  // Step 9: Remove horizontal rules
  processed = processed.replace(/^\s*\*\s*\*\s*\*\s*$/gm, '');
  processed = processed.replace(/^\s*-{3,}\s*$/gm, '');
  
  // Step 10: Add line breaks before structural markers
  const articleWords = 'Article|Artikel|Artículo|Articolo|Artigo|Artykuł|Článek|Článok|Articolul|Член|Άρθρο|Artikkel|Airteagal|Artikolu';
  processed = processed.replace(new RegExp(`(${articleWords})\\s+(\\d+)`, 'gi'), '\n$1 $2');
  
  const chapterWords = 'CHAPTER|KAPITEL|CHAPITRE|CAPÍTULO|CAPO|HOOFDSTUK|ROZDZIAŁ|KAPITOLA|CAPITOLUL|ГЛАВА|ΚΕΦΑΛΑΙΟ|PEATÜKK|NODAĻA|SKYRIUS|POGLAVJE|POGLAVLJE|KAPITOLU|CAIBIDIL';
  processed = processed.replace(new RegExp(`(${chapterWords})\\s+([IVXLCDM]+)`, 'gi'), '\n$1 $2');
  
  const annexWords = 'ANNEX|ANHANG|ANNEXE|ANEXO|ALLEGATO|BIJLAGE|ZAŁĄCZNIK|PŘÍLOHA|PRÍLOHA|ANEXA|ПРИЛОЖЕНИЕ|ΠΑΡΑΡΤΗΜΑ|BILAGA|BILAG|LIITE|LISA|PIELIKUMS|PRIEDAS|PRILOGA|PRILOG|ANNESS|IARSCRÍBHINN';
  processed = processed.replace(new RegExp(`(${annexWords})\\s+([IVXLCDM]+)`, 'gi'), '\n$1 $2');
  
  // Step 11: Ensure recitals are on new lines
  processed = processed.replace(/([.;:])(\s*)\((\d{1,3})\)\s+/g, '$1\n($3) ');
  
  // Step 12: Normalize whitespace
  processed = processed.replace(/  +/g, ' ');
  processed = processed.replace(/\n{3,}/g, '\n\n');
  processed = processed.split('\n').map(line => line.trim()).join('\n');
  
  return processed;
}

// === Parsing functions ===
export function parseRecitals(lines: string[], lang: string, endLine: number): ParsedRecital[] {
  const recitals: ParsedRecital[] = [];
  const seenNumbers = new Set<number>();
  
  let currentRecital: ParsedRecital | null = null;
  let contentLines: string[] = [];
  
  const recitalPattern = /^\((\d+)\)\s*/;
  
  for (let i = 0; i < endLine && i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (!trimmedLine) continue;
    
    const match = trimmedLine.match(recitalPattern);
    if (match) {
      // Save previous recital
      if (currentRecital && !seenNumbers.has(currentRecital.recitalNumber)) {
        currentRecital.content = (currentRecital.content + ' ' + contentLines.join(' ')).trim();
        if (currentRecital.content) {
          recitals.push(currentRecital);
          seenNumbers.add(currentRecital.recitalNumber);
        }
      }
      
      const num = parseInt(match[1], 10);
      currentRecital = {
        recitalNumber: num,
        content: trimmedLine.replace(recitalPattern, '').trim(),
      };
      contentLines = [];
    } else if (currentRecital) {
      contentLines.push(trimmedLine);
    }
  }
  
  // Save last recital
  if (currentRecital && !seenNumbers.has(currentRecital.recitalNumber)) {
    currentRecital.content = (currentRecital.content + ' ' + contentLines.join(' ')).trim();
    if (currentRecital.content) {
      recitals.push(currentRecital);
    }
  }
  
  return recitals.sort((a, b) => a.recitalNumber - b.recitalNumber);
}

export function parseArticles(lines: string[], lang: string, startLine: number, endLine: number): ParsedArticle[] {
  const articles: ParsedArticle[] = [];
  const seenNumbers = new Set<number>();
  const pattern = ARTICLE_PATTERNS[lang] || ARTICLE_PATTERNS.en;
  const chapterPattern = CHAPTER_PATTERNS[lang] || CHAPTER_PATTERNS.en;
  
  let currentArticle: ParsedArticle | null = null;
  let currentChapter = 0;
  let contentLines: string[] = [];
  
  for (let i = startLine; i < endLine && i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    
    // Check for chapter
    const chapterMatch = trimmedLine.match(chapterPattern);
    if (chapterMatch) {
      currentChapter = romanToNumber(chapterMatch[1]);
      continue;
    }
    
    // Check for article
    const articleMatch = trimmedLine.match(pattern);
    if (articleMatch) {
      // Save previous article
      if (currentArticle && !seenNumbers.has(currentArticle.articleNumber)) {
        currentArticle.content = contentLines.join('\n').trim();
        articles.push(currentArticle);
        seenNumbers.add(currentArticle.articleNumber);
      }
      
      const articleNumber = parseInt(articleMatch[1], 10);
      const titlePart = trimmedLine.replace(pattern, '').trim();
      
      currentArticle = {
        articleNumber,
        title: titlePart || `Article ${articleNumber}`,
        content: '',
        chapterNumber: currentChapter || undefined,
      };
      contentLines = [];
    } else if (currentArticle) {
      // Check if this is the title line
      if (currentArticle.title === `Article ${currentArticle.articleNumber}` && trimmedLine && contentLines.length === 0) {
        currentArticle.title = trimmedLine;
      } else {
        contentLines.push(lines[i]);
      }
    }
  }
  
  // Save last article
  if (currentArticle && !seenNumbers.has(currentArticle.articleNumber)) {
    currentArticle.content = contentLines.join('\n').trim();
    articles.push(currentArticle);
  }
  
  return articles.sort((a, b) => a.articleNumber - b.articleNumber);
}

export function parseDefinitions(articles: ParsedArticle[]): ParsedDefinition[] {
  const definitions: ParsedDefinition[] = [];
  const article2 = articles.find(a => a.articleNumber === 2);
  
  if (!article2) return definitions;
  
  // Multiple patterns for different languages
  const patterns = [
    /^\((\d+)\)\s*[''\""]([^''\"\"\n]+)[''\""]?\s*means\s*/i,
    /^\((\d+)\)\s*[''\""]?([^''\"\"\n]+)[''\""]?\s*(?:–|—|-|:)\s*/,
    /^\((\d+)\)\s*[''\""]([^''\"\"\n]+)[''\""]?\s*bezeichnet\s*/i,
    /^\((\d+)\)\s*[''\""]([^''\"\"\n]+)[''\""]?\s*désigne\s*/i,
  ];
  
  const lines = article2.content.split('\n');
  let currentDef: ParsedDefinition | null = null;
  let defContent: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    let match = null;
    for (const pattern of patterns) {
      match = trimmed.match(pattern);
      if (match) break;
    }
    
    if (match) {
      if (currentDef && currentDef.term && currentDef.definition) {
        currentDef.definition = (currentDef.definition + ' ' + defContent.join(' ')).trim();
        definitions.push(currentDef);
      }
      
      currentDef = {
        definitionNumber: parseInt(match[1], 10),
        term: match[2].trim().replace(/['\"';,]$/, ''),
        definition: trimmed.replace(match[0], '').trim(),
      };
      defContent = [];
    } else if (currentDef && trimmed) {
      defContent.push(trimmed);
    }
  }
  
  if (currentDef && currentDef.term) {
    currentDef.definition = (currentDef.definition + ' ' + defContent.join(' ')).trim();
    if (currentDef.definition) {
      definitions.push(currentDef);
    }
  }
  
  return definitions;
}

export function parseAnnexes(lines: string[], lang: string, startLine: number): ParsedAnnex[] {
  const annexes: ParsedAnnex[] = [];
  const pattern = ANNEX_PATTERNS[lang] || ANNEX_PATTERNS.en;
  
  let currentAnnex: ParsedAnnex | null = null;
  let contentLines: string[] = [];
  let titleSet = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    
    const annexMatch = trimmedLine.match(pattern);
    if (annexMatch) {
      if (currentAnnex) {
        currentAnnex.content = contentLines.join('\n').trim();
        annexes.push(currentAnnex);
      }
      
      const romanNumeral = annexMatch[1].toUpperCase();
      currentAnnex = {
        annexNumber: romanToNumber(romanNumeral),
        romanNumeral,
        title: '',
        content: '',
      };
      contentLines = [];
      titleSet = false;
    } else if (currentAnnex) {
      if (!titleSet && trimmedLine) {
        currentAnnex.title = trimmedLine;
        titleSet = true;
      } else {
        contentLines.push(lines[i]);
      }
    }
  }
  
  if (currentAnnex) {
    currentAnnex.content = contentLines.join('\n').trim();
    annexes.push(currentAnnex);
  }
  
  return annexes;
}

export function parseFootnotes(text: string, analysis: StructureAnalysis): ParsedFootnote[] {
  const footnotes: ParsedFootnote[] = [];
  const seenMarkers = new Set<string>();
  
  // EUR-Lex footnotes at the end of document
  // Look for sections with multiple (n) OJ L... patterns
  const lines = text.split('\n');
  
  // Find the footnote section - usually at very end after annexes
  let footnoteStart = lines.length;
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 300); i--) {
    const line = lines[i].trim();
    // Footnotes look like: (1) OJ L 257, 28.8.2014, p. 73.
    if (/^\([\d*]+\)\s+(?:OJ|ABl\.|GU|DO|Dz\.U\.|HL|JO)/i.test(line)) {
      footnoteStart = Math.min(footnoteStart, i);
    }
    // Also check for regulation/directive references
    if (/^\([\d*]+\)\s+(?:Regulation|Verordnung|Règlement|Reglamento|Regolamento|Rozporządzenie|Nařízení|Regulamentul|Регламент|Κανονισμός)/i.test(line)) {
      footnoteStart = Math.min(footnoteStart, i);
    }
  }
  
  // Parse footnotes from the detected section
  const footnoteSection = lines.slice(footnoteStart).join('\n');
  
  // Pattern for numbered footnotes: (1) content
  const footnotePattern = /^\((\d+|\*{1,3})\)\s+(.+)$/gm;
  let match;
  while ((match = footnotePattern.exec(footnoteSection)) !== null) {
    const marker = match[1];
    const content = match[2].trim();
    
    // Validate it looks like a legal reference
    if (content.length > 10 && !seenMarkers.has(marker)) {
      if (/OJ|ABl\.|GU|DO|Dz\.U\.|HL|JO|Regulation|Directive|Decision|Verordnung|Richtlinie|Beschluss|Règlement|Directive|Décision|EUR-Lex|CELEX/i.test(content)) {
        footnotes.push({ marker, content });
        seenMarkers.add(marker);
      }
    }
  }
  
  // Also check for inline [^n]: definitions
  const caretPattern = /\[\^(\d+)\]:\s*(.+)$/gm;
  while ((match = caretPattern.exec(text)) !== null) {
    const marker = match[1];
    const content = match[2].trim();
    if (content.length > 5 && !seenMarkers.has(marker)) {
      footnotes.push({ marker, content });
      seenMarkers.add(marker);
    }
  }
  
  return footnotes.sort((a, b) => {
    const aNum = parseInt(a.marker) || 999;
    const bNum = parseInt(b.marker) || 999;
    return aNum - bNum;
  });
}

// === Main parsing function ===
export async function parseDocumentAdaptive(text: string): Promise<{
  content: ParsedContent;
  analysis: StructureAnalysis;
}> {
  // Step 1: Analyze structure
  const analysis = analyzeStructure(text);
  console.log('Structure analysis:', analysis);
  
  // Step 2: Preprocess based on analysis
  const processed = adaptivePreprocess(text, analysis);
  const lines = processed.split('\n');
  
  // Step 3: Find boundaries
  let recitalsEnd = analysis.adoptionLineIndex > 0 ? analysis.adoptionLineIndex : lines.length;
  let articlesStart = 0;
  let annexesStart = lines.length;
  
  // Re-find boundaries in processed text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (recitalsEnd === lines.length) {
      for (const marker of ADOPTION_MARKERS) {
        if (marker.test(line)) {
          recitalsEnd = i;
          break;
        }
      }
    }
    
    if (articlesStart === 0) {
      for (const pattern of Object.values(ARTICLE_PATTERNS)) {
        if (pattern.test(line)) {
          articlesStart = i;
          break;
        }
      }
    }
    
    if (annexesStart === lines.length) {
      for (const pattern of Object.values(ANNEX_PATTERNS)) {
        if (pattern.test(line)) {
          annexesStart = i;
          break;
        }
      }
    }
  }
  
  const lang = analysis.detectedLanguage === 'unknown' ? 'en' : analysis.detectedLanguage;
  const articlesEnd = annexesStart > articlesStart ? annexesStart : lines.length;
  
  // Step 4: Parse all content types
  const recitals = parseRecitals(lines, lang, recitalsEnd);
  const articles = parseArticles(lines, lang, articlesStart, articlesEnd);
  const definitions = parseDefinitions(articles);
  const annexes = parseAnnexes(lines, lang, annexesStart);
  const footnotes = parseFootnotes(processed, analysis);
  
  const content: ParsedContent = {
    articles,
    recitals,
    definitions,
    annexes,
    footnotes,
    detectedLanguage: lang,
  };
  
  return { content, analysis };
}

// === Pattern learning (save successful patterns) ===
export async function saveSuccessfulPattern(
  languageCode: string,
  sourceType: string,
  patterns: {
    articlePattern?: string;
    recitalPattern?: string;
    chapterPattern?: string;
    annexPattern?: string;
    adoptionMarker?: string;
  },
  success: boolean
): Promise<void> {
  try {
    // First check if pattern exists
    const { data: existing } = await supabase
      .from('parsing_patterns')
      .select('id, success_count, failure_count')
      .eq('language_code', languageCode)
      .eq('source_type', sourceType)
      .maybeSingle();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('parsing_patterns')
        .update({
          success_count: success ? (existing.success_count || 0) + 1 : existing.success_count,
          failure_count: !success ? (existing.failure_count || 0) + 1 : existing.failure_count,
          article_pattern: patterns.articlePattern || null,
          recital_pattern: patterns.recitalPattern || null,
          chapter_pattern: patterns.chapterPattern || null,
          annex_pattern: patterns.annexPattern || null,
          adoption_marker: patterns.adoptionMarker || null,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (error) console.error('Failed to update pattern:', error);
    } else {
      // Insert new
      const { error } = await supabase
        .from('parsing_patterns')
        .insert({
          language_code: languageCode,
          source_type: sourceType,
          article_pattern: patterns.articlePattern || null,
          recital_pattern: patterns.recitalPattern || null,
          chapter_pattern: patterns.chapterPattern || null,
          annex_pattern: patterns.annexPattern || null,
          adoption_marker: patterns.adoptionMarker || null,
          success_count: success ? 1 : 0,
          failure_count: success ? 0 : 1,
          last_used_at: new Date().toISOString(),
        });
      
      if (error) console.error('Failed to save pattern:', error);
    }
  } catch (err) {
    console.error('Error saving pattern:', err);
  }
}

export async function getLearnedPatterns(languageCode: string): Promise<{
  articlePattern?: string;
  recitalPattern?: string;
  chapterPattern?: string;
  annexPattern?: string;
  adoptionMarker?: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from('parsing_patterns')
      .select('article_pattern, recital_pattern, chapter_pattern, annex_pattern, adoption_marker')
      .eq('language_code', languageCode)
      .order('success_count', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    return {
      articlePattern: data.article_pattern || undefined,
      recitalPattern: data.recital_pattern || undefined,
      chapterPattern: data.chapter_pattern || undefined,
      annexPattern: data.annex_pattern || undefined,
      adoptionMarker: data.adoption_marker || undefined,
    };
  } catch {
    return null;
  }
}

// === Section boundaries for manual corrections ===
export interface SectionBoundaries {
  recitalStart?: number;
  recitalEnd?: number;
  articleStart?: number;
  articleEnd?: number;
  annexStart?: number;
  annexEnd?: number;
  footnoteStart?: number;
  footnoteEnd?: number;
}

export interface BoundaryMarkers {
  recitalStartText?: string;
  articleStartText?: string;
  annexStartText?: string;
  footnoteStartText?: string;
}

export async function saveSectionBoundaries(
  languageCode: string,
  sourceType: string,
  boundaries: SectionBoundaries,
  markers: BoundaryMarkers
): Promise<boolean> {
  try {
    // First check if pattern exists
    const { data: existing } = await supabase
      .from('parsing_patterns')
      .select('id')
      .eq('language_code', languageCode)
      .eq('source_type', sourceType)
      .maybeSingle();
    
    const boundariesJson = {
      recitals: boundaries.recitalStart !== undefined ? { start: boundaries.recitalStart, end: boundaries.recitalEnd } : undefined,
      articles: boundaries.articleStart !== undefined ? { start: boundaries.articleStart, end: boundaries.articleEnd } : undefined,
      annexes: boundaries.annexStart !== undefined ? { start: boundaries.annexStart, end: boundaries.annexEnd } : undefined,
      footnotes: boundaries.footnoteStart !== undefined ? { start: boundaries.footnoteStart, end: boundaries.footnoteEnd } : undefined,
    };
    
    const markersJson = {
      recitalStart: markers.recitalStartText,
      articleStart: markers.articleStartText,
      annexStart: markers.annexStartText,
      footnoteStart: markers.footnoteStartText,
    };
    
    if (existing) {
      const { error } = await supabase
        .from('parsing_patterns')
        .update({
          section_boundaries: boundariesJson,
          boundary_markers: markersJson,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Failed to update boundaries:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('parsing_patterns')
        .insert({
          language_code: languageCode,
          source_type: sourceType,
          section_boundaries: boundariesJson,
          boundary_markers: markersJson,
          success_count: 0,
          failure_count: 0,
        });
      
      if (error) {
        console.error('Failed to save boundaries:', error);
        return false;
      }
    }
    
    toast.success('Section boundaries saved successfully');
    return true;
  } catch (err) {
    console.error('Error saving boundaries:', err);
    return false;
  }
}

export async function getSectionBoundaries(languageCode: string): Promise<{
  boundaries: SectionBoundaries;
  markers: BoundaryMarkers;
} | null> {
  try {
    const { data, error } = await supabase
      .from('parsing_patterns')
      .select('section_boundaries, boundary_markers')
      .eq('language_code', languageCode)
      .order('success_count', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) return null;
    
    const sb = data.section_boundaries as any || {};
    const bm = data.boundary_markers as any || {};
    
    return {
      boundaries: {
        recitalStart: sb.recitals?.start,
        recitalEnd: sb.recitals?.end,
        articleStart: sb.articles?.start,
        articleEnd: sb.articles?.end,
        annexStart: sb.annexes?.start,
        annexEnd: sb.annexes?.end,
        footnoteStart: sb.footnotes?.start,
        footnoteEnd: sb.footnotes?.end,
      },
      markers: {
        recitalStartText: bm.recitalStart,
        articleStartText: bm.articleStart,
        annexStartText: bm.annexStart,
        footnoteStartText: bm.footnoteStart,
      },
    };
  } catch {
    return null;
  }
}

// Parse with manual boundaries applied
export async function parseDocumentWithBoundaries(
  text: string,
  boundaries: SectionBoundaries
): Promise<{ content: ParsedContent; analysis: StructureAnalysis }> {
  const analysis = analyzeStructure(text);
  const processed = adaptivePreprocess(text, analysis);
  const lines = processed.split('\n');
  
  const lang = analysis.detectedLanguage !== 'unknown' ? analysis.detectedLanguage : 'en';
  
  // Use manual boundaries if provided, otherwise use detected
  const recitalsEnd = boundaries.recitalEnd !== undefined 
    ? Math.floor(boundaries.recitalEnd / 50) // approximate line from char index
    : (analysis.adoptionLineIndex > 0 ? analysis.adoptionLineIndex : analysis.firstArticleIndex > 0 ? analysis.firstArticleIndex : 200);
  
  const articlesStart = boundaries.articleStart !== undefined
    ? Math.floor(boundaries.articleStart / 50)
    : (analysis.firstArticleIndex > 0 ? analysis.firstArticleIndex : 0);
  
  const articlesEnd = boundaries.articleEnd !== undefined
    ? Math.floor(boundaries.articleEnd / 50)
    : (analysis.firstAnnexIndex > 0 ? analysis.firstAnnexIndex : lines.length);
  
  const annexesStart = boundaries.annexStart !== undefined
    ? Math.floor(boundaries.annexStart / 50)
    : (analysis.firstAnnexIndex > 0 ? analysis.firstAnnexIndex : lines.length);
  
  const recitals = parseRecitals(lines, lang, recitalsEnd);
  const articles = parseArticles(lines, lang, articlesStart, articlesEnd);
  const definitions = parseDefinitions(articles);
  const annexes = parseAnnexes(lines, lang, annexesStart);
  const footnotes = parseFootnotes(processed, analysis);
  
  const content: ParsedContent = {
    articles,
    recitals,
    definitions,
    annexes,
    footnotes,
    detectedLanguage: lang,
  };
  
  return { content, analysis };
}
