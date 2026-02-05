 import { useState, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
// Multi-language article patterns (Article X followed by title)
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
 
// Multi-language recital patterns - (1), (2), etc.
 const RECITAL_PATTERNS: Record<string, RegExp> = {
   en: /^\((\d+)\)/,
   de: /^\((\d+)\)/,
   fr: /^\((\d+)\)/,
   es: /^\((\d+)\)/,
   it: /^\((\d+)\)/,
   pt: /^\((\d+)\)/,
   nl: /^\((\d+)\)/,
   pl: /^\((\d+)\)/,
   cs: /^\((\d+)\)/,
   sk: /^\((\d+)\)/,
   hu: /^\((\d+)\)/,
   ro: /^\((\d+)\)/,
   bg: /^\((\d+)\)/,
   el: /^\((\d+)\)/,
   sv: /^\((\d+)\)/,
   da: /^\((\d+)\)/,
   fi: /^\((\d+)\)/,
   et: /^\((\d+)\)/,
   lv: /^\((\d+)\)/,
   lt: /^\((\d+)\)/,
   sl: /^\((\d+)\)/,
   hr: /^\((\d+)\)/,
   mt: /^\((\d+)\)/,
   ga: /^\((\d+)\)/,
 };
 
// Chapter patterns with Roman numerals (CHAPTER I, KAPITEL I, etc.)
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
 
// Annex patterns with Roman numerals (ANNEX I, ANHANG I, etc.)
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

// "HAS ADOPTED THIS REGULATION" markers - signals end of recitals
const ADOPTION_MARKERS: RegExp[] = [
  /^HAS ADOPTED THIS REGULATION/i,
  /^HAT FOLGENDE VERORDNUNG ERLASSEN/i,
  /^A ADOPTÉ LE PRÉSENT RÈGLEMENT/i,
  /^HA ADOPTADO EL PRESENTE REGLAMENTO/i,
  /^HA ADOTTATO IL PRESENTE REGOLAMENTO/i,
  /^ADOTOU O PRESENTE REGULAMENTO/i,
  /^HEEFT DE VOLGENDE VERORDENING VASTGESTELD/i,
  /^PRZYJMUJE NINIEJSZE ROZPORZĄDZENIE/i,
  /^PŘIJALA TOTO NAŘÍZENÍ/i,
  /^PRIJALA TOTO NARIADENIE/i,
  /^ELFOGADTA EZT A RENDELETET/i,
  /^ADOPTĂ PREZENTUL REGULAMENT/i,
  /^ПРИЕ НАСТОЯЩИЯ РЕГЛАМЕНТ/i,
  /^ΕΞΕΔΩΣΕ ΤΟΝ ΠΑΡΟΝΤΑ ΚΑΝΟΝΙΣΜΟ/i,
  /^HAR ANTAGIT DENNA FÖRORDNING/i,
  /^HAR VEDTAGET DENNE FORORDNING/i,
  /^ON ANTANUT TÄMÄN ASETUKSEN/i,
  /^ON VASTU VÕTNUD KÄESOLEVA MÄÄRUSE/i,
  /^IR PIEŅĒMUSI ŠO REGULU/i,
  /^PRIĖMĖ ŠĮ REGLAMENTĄ/i,
  /^JE SPREJELA NASLEDNJO UREDBO/i,
  /^DONIJELI SU OVU UREDBU/i,
  /^ADOTTAW DAN IR-REGOLAMENT/i,
  /^TAR GHLAC AN RIALACHÁN SEO/i,
];

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
 
 export interface ValidationResult {
   isValid: boolean;
   errors: string[];
   warnings: string[];
   articleCount: number;
   recitalCount: number;
  definitionCount: number;
  annexCount: number;
  footnoteCount: number;
   missingArticles: number[];
   missingRecitals: number[];
   duplicateArticles: number[];
   duplicateRecitals: number[];
 }
 
 export interface EnglishSource {
   articles: Array<{ id: number; article_number: number; title: string; content: string }>;
   recitals: Array<{ id: number; recital_number: number; content: string }>;
  definitions: Array<{ id: number; term: string; definition: string }>;
  annexes: Array<{ id: string; title: string; content: string }>;
 }
 
 export function useTranslationImport() {
   const [isParsing, setIsParsing] = useState(false);
   const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
   const [validation, setValidation] = useState<ValidationResult | null>(null);
   const [englishSource, setEnglishSource] = useState<EnglishSource | null>(null);
   const [isImporting, setIsImporting] = useState(false);
 
  // Detect language from content patterns (checks article patterns first, then chapters)
   const detectLanguage = useCallback((text: string): string => {
    const lines = text.split('\n').slice(0, 500); // Check first 500 lines
    
     for (const [lang, pattern] of Object.entries(ARTICLE_PATTERNS)) {
      for (const line of lines) {
        if (pattern.test(line.trim())) {
          return lang;
        }
       }
     }
    
     for (const [lang, pattern] of Object.entries(CHAPTER_PATTERNS)) {
      for (const line of lines) {
        if (pattern.test(line.trim())) {
          return lang;
        }
       }
     }
    
     return 'unknown';
   }, []);
 
  // Find the boundary between recitals and articles sections
  const findSectionBoundaries = useCallback((lines: string[]): { recitalsEnd: number; articlesStart: number; annexesStart: number } => {
    let recitalsEnd = -1;
    let articlesStart = -1;
    let annexesStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for adoption marker (end of recitals)
      if (recitalsEnd === -1) {
        for (const marker of ADOPTION_MARKERS) {
          if (marker.test(line)) {
            recitalsEnd = i;
            break;
          }
        }
      }
      
      // Check for first article
      if (articlesStart === -1) {
        for (const pattern of Object.values(ARTICLE_PATTERNS)) {
          if (pattern.test(line)) {
            articlesStart = i;
            break;
          }
        }
      }
      
      // Check for first annex
      if (annexesStart === -1) {
        for (const pattern of Object.values(ANNEX_PATTERNS)) {
          if (pattern.test(line)) {
            annexesStart = i;
            break;
          }
        }
      }
    }
    
    return { recitalsEnd, articlesStart, annexesStart };
  }, []);

   // Parse articles from text
  const parseArticles = useCallback((lines: string[], lang: string, startLine: number, endLine: number): ParsedArticle[] => {
     const articles: ParsedArticle[] = [];
     const pattern = ARTICLE_PATTERNS[lang] || ARTICLE_PATTERNS.en;
     const chapterPattern = CHAPTER_PATTERNS[lang] || CHAPTER_PATTERNS.en;
     
     let currentArticle: ParsedArticle | null = null;
     let currentChapter = 0;
     let contentLines: string[] = [];
     
    for (let i = startLine; i < endLine && i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
       
       // Check for chapter marker
       const chapterMatch = trimmedLine.match(chapterPattern);
       if (chapterMatch) {
         currentChapter = romanToNumber(chapterMatch[1]);
         continue;
       }
       
       // Check for article marker
       const articleMatch = trimmedLine.match(pattern);
       if (articleMatch) {
         // Save previous article
         if (currentArticle) {
           currentArticle.content = contentLines.join('\n').trim();
           articles.push(currentArticle);
         }
         
         // Start new article
         const articleNumber = parseInt(articleMatch[1], 10);
         // Title is usually on the same line or next line after "Article X"
         const titlePart = trimmedLine.replace(pattern, '').trim();
         
         currentArticle = {
           articleNumber,
           title: titlePart || `Article ${articleNumber}`,
           content: '',
           chapterNumber: currentChapter || undefined,
         };
         contentLines = [];
       } else if (currentArticle) {
         // If we haven't set title yet and this is the first content line, use it as title
         if (currentArticle.title === `Article ${currentArticle.articleNumber}` && trimmedLine && contentLines.length === 0) {
           currentArticle.title = trimmedLine;
         } else {
          contentLines.push(lines[i]);
         }
       }
     }
     
     // Don't forget the last article
     if (currentArticle) {
       currentArticle.content = contentLines.join('\n').trim();
       articles.push(currentArticle);
     }
     
     return articles;
   }, []);
 
   // Parse recitals from text
  const parseRecitals = useCallback((lines: string[], lang: string, endLine: number): ParsedRecital[] => {
     const recitals: ParsedRecital[] = [];
     const pattern = RECITAL_PATTERNS[lang] || RECITAL_PATTERNS.en;
     
     let currentRecital: ParsedRecital | null = null;
     let contentLines: string[] = [];
     
    for (let i = 0; i < endLine && i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
       
       // Check for recital marker
       const recitalMatch = trimmedLine.match(pattern);
       if (recitalMatch) {
         // Save previous recital
         if (currentRecital) {
          currentRecital.content = (currentRecital.content + ' ' + contentLines.join(' ')).trim();
           if (currentRecital.content) {
             recitals.push(currentRecital);
           }
         }
         
         const recitalNumber = parseInt(recitalMatch[1], 10);
         currentRecital = {
           recitalNumber,
           content: trimmedLine.replace(pattern, '').trim(),
         };
         contentLines = [];
      } else if (currentRecital && trimmedLine) {
        contentLines.push(trimmedLine);
       }
     }
     
     // Don't forget the last recital
     if (currentRecital) {
       currentRecital.content = (currentRecital.content + ' ' + contentLines.join(' ')).trim();
       if (currentRecital.content) {
         recitals.push(currentRecital);
       }
     }
     
     return recitals;
   }, []);
 
  // Parse definitions from Article 2 content
  const parseDefinitions = useCallback((articles: ParsedArticle[]): ParsedDefinition[] => {
    const definitions: ParsedDefinition[] = [];
    const article2 = articles.find(a => a.articleNumber === 2);
    
    if (!article2) return definitions;
    
    // Definitions are numbered like (1) 'term' means...
    // or ('term') means... pattern
    const defPattern = /^\((\d+)\)\s*[''"]([^''"]+)[''"]?\s*means\s*/i;
    const altDefPattern = /^\((\d+)\)\s*[''"]?([^''"]+)[''"]?\s*(?:–|—|-|:)\s*/;
    
    const lines = article2.content.split('\n');
    let currentDef: ParsedDefinition | null = null;
    let defContent: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      let match = trimmed.match(defPattern) || trimmed.match(altDefPattern);
      if (match) {
        // Save previous definition
        if (currentDef) {
          currentDef.definition = defContent.join(' ').trim();
          if (currentDef.term && currentDef.definition) {
            definitions.push(currentDef);
          }
        }
        
        currentDef = {
          definitionNumber: parseInt(match[1], 10),
          term: match[2].trim().replace(/[''";,]$/, ''),
          definition: trimmed.replace(match[0], '').trim(),
        };
        defContent = [];
      } else if (currentDef && trimmed) {
        defContent.push(trimmed);
      }
    }
    
    // Don't forget the last definition
    if (currentDef) {
      currentDef.definition = (currentDef.definition + ' ' + defContent.join(' ')).trim();
      if (currentDef.term && currentDef.definition) {
        definitions.push(currentDef);
      }
    }
    
    return definitions;
  }, []);

  // Parse annexes from text
  const parseAnnexes = useCallback((lines: string[], lang: string, startLine: number): ParsedAnnex[] => {
    const annexes: ParsedAnnex[] = [];
    const pattern = ANNEX_PATTERNS[lang] || ANNEX_PATTERNS.en;
    
    let currentAnnex: ParsedAnnex | null = null;
    let contentLines: string[] = [];
    let titleSet = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      // Check for annex marker
      const annexMatch = trimmedLine.match(pattern);
      if (annexMatch) {
        // Save previous annex
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
        // First non-empty line after annex marker is the title
        if (!titleSet && trimmedLine) {
          currentAnnex.title = trimmedLine;
          titleSet = true;
        } else {
          contentLines.push(lines[i]);
        }
      }
    }
    
    // Don't forget the last annex
    if (currentAnnex) {
      currentAnnex.content = contentLines.join('\n').trim();
      annexes.push(currentAnnex);
    }
    
    return annexes;
  }, []);

  // Parse footnotes from document (usually at bottom with (1), (2) markers)
  const parseFootnotes = useCallback((text: string): ParsedFootnote[] => {
    const footnotes: ParsedFootnote[] = [];
    
    // Look for footnote section at the end - patterns like "(1) OJ L..." or "(*) ..."
    const footnotePattern = /^\((\d+|\*{1,3})\)\s+(.+)$/gm;
    
    // Find footnotes in the last portion of the document
    const lines = text.split('\n');
    const lastSection = lines.slice(-100).join('\n'); // Check last 100 lines
    
    let match;
    while ((match = footnotePattern.exec(lastSection)) !== null) {
      const marker = match[1];
      const content = match[2].trim();
      
      // Validate it looks like a footnote (references OJ, regulation, directive, etc.)
      if (content.length > 10 && /OJ|Regulation|Directive|Decision|COM|EUR-Lex/i.test(content)) {
        footnotes.push({ marker, content });
      }
    }
    
    return footnotes;
  }, []);

   // Load English source data for comparison
   const loadEnglishSource = useCallback(async () => {
    const [articlesRes, recitalsRes, definitionsRes, annexesRes] = await Promise.all([
       supabase.from('articles').select('id, article_number, title, content').order('article_number'),
       supabase.from('recitals').select('id, recital_number, content').order('recital_number'),
      supabase.from('definitions').select('id, term, definition').order('id'),
      supabase.from('annexes').select('id, title, content'),
     ]);
 
    if (articlesRes.error || recitalsRes.error || definitionsRes.error || annexesRes.error) {
       toast.error('Failed to load English source data');
       return null;
     }
 
     const source: EnglishSource = {
       articles: articlesRes.data || [],
       recitals: recitalsRes.data || [],
      definitions: definitionsRes.data || [],
      annexes: annexesRes.data || [],
     };
     
     setEnglishSource(source);
     return source;
   }, []);
 
   // Validate parsed content against English source
   const validateContent = useCallback((parsed: ParsedContent, source: EnglishSource): ValidationResult => {
     const errors: string[] = [];
     const warnings: string[] = [];
     
     const expectedArticles = source.articles.map(a => a.article_number);
     const expectedRecitals = source.recitals.map(r => r.recital_number);
     
     const parsedArticleNumbers = parsed.articles.map(a => a.articleNumber);
     const parsedRecitalNumbers = parsed.recitals.map(r => r.recitalNumber);
     
     // Find missing articles
     const missingArticles = expectedArticles.filter(n => !parsedArticleNumbers.includes(n));
     const missingRecitals = expectedRecitals.filter(n => !parsedRecitalNumbers.includes(n));
     
     // Find duplicates
     const duplicateArticles = parsedArticleNumbers.filter((n, i) => parsedArticleNumbers.indexOf(n) !== i);
     const duplicateRecitals = parsedRecitalNumbers.filter((n, i) => parsedRecitalNumbers.indexOf(n) !== i);
     
     // Find extra articles/recitals
     const extraArticles = parsedArticleNumbers.filter(n => !expectedArticles.includes(n));
     const extraRecitals = parsedRecitalNumbers.filter(n => !expectedRecitals.includes(n));
     
     // Build errors
     if (parsed.articles.length !== source.articles.length) {
       errors.push(`Article count mismatch: found ${parsed.articles.length}, expected ${source.articles.length}`);
     }
     
     if (parsed.recitals.length !== source.recitals.length) {
       errors.push(`Recital count mismatch: found ${parsed.recitals.length}, expected ${source.recitals.length}`);
     }
     
     if (missingArticles.length > 0) {
       errors.push(`Missing articles: ${missingArticles.slice(0, 10).join(', ')}${missingArticles.length > 10 ? '...' : ''}`);
     }
     
     if (missingRecitals.length > 0) {
       errors.push(`Missing recitals: ${missingRecitals.slice(0, 10).join(', ')}${missingRecitals.length > 10 ? '...' : ''}`);
     }
     
     if (duplicateArticles.length > 0) {
       errors.push(`Duplicate articles found: ${[...new Set(duplicateArticles)].join(', ')}`);
     }
     
     if (duplicateRecitals.length > 0) {
       errors.push(`Duplicate recitals found: ${[...new Set(duplicateRecitals)].join(', ')}`);
     }
     
     if (extraArticles.length > 0) {
       warnings.push(`Extra articles not in source: ${extraArticles.join(', ')}`);
     }
     
     if (extraRecitals.length > 0) {
       warnings.push(`Extra recitals not in source: ${extraRecitals.join(', ')}`);
     }
     
     // Check for very short content (might indicate parsing issues)
     const shortArticles = parsed.articles.filter(a => a.content.length < 50);
     if (shortArticles.length > 5) {
       warnings.push(`${shortArticles.length} articles have very short content (< 50 chars) - may indicate parsing issues`);
     }

    // Validate definitions
    if (parsed.definitions.length > 0) {
      if (parsed.definitions.length !== source.definitions.length) {
        warnings.push(`Definition count: found ${parsed.definitions.length}, source has ${source.definitions.length}`);
      }
    }

    // Validate annexes
    if (parsed.annexes.length > 0) {
      if (parsed.annexes.length !== source.annexes.length) {
        warnings.push(`Annex count: found ${parsed.annexes.length}, source has ${source.annexes.length}`);
      }
    }

    // Note footnotes found
    if (parsed.footnotes.length > 0) {
      warnings.push(`Found ${parsed.footnotes.length} footnotes for review`);
    }
     
     return {
       isValid: errors.length === 0,
       errors,
       warnings,
       articleCount: parsed.articles.length,
       recitalCount: parsed.recitals.length,
      definitionCount: parsed.definitions.length,
      annexCount: parsed.annexes.length,
      footnoteCount: parsed.footnotes.length,
       missingArticles,
       missingRecitals,
       duplicateArticles: [...new Set(duplicateArticles)],
       duplicateRecitals: [...new Set(duplicateRecitals)],
     };
   }, []);
 
   // Main parse function
   const parseDocument = useCallback(async (text: string) => {
     setIsParsing(true);
     setParsedContent(null);
     setValidation(null);
     
     try {
       // Load English source if not loaded
       let source = englishSource;
       if (!source) {
         source = await loadEnglishSource();
         if (!source) {
           throw new Error('Failed to load English source data');
         }
       }
       
       // Detect language
       const detectedLanguage = detectLanguage(text);
       if (detectedLanguage === 'unknown') {
         toast.warning('Could not detect language - using English patterns');
       }
       
       const lang = detectedLanguage === 'unknown' ? 'en' : detectedLanguage;
       
      // Split into lines and find section boundaries
      const lines = text.split('\n');
      const boundaries = findSectionBoundaries(lines);
      
      // Determine parse ranges
      const recitalsEndLine = boundaries.recitalsEnd > 0 ? boundaries.recitalsEnd : boundaries.articlesStart > 0 ? boundaries.articlesStart : lines.length;
      const articlesStartLine = boundaries.articlesStart > 0 ? boundaries.articlesStart : 0;
      const articlesEndLine = boundaries.annexesStart > 0 ? boundaries.annexesStart : lines.length;
      const annexesStartLine = boundaries.annexesStart > 0 ? boundaries.annexesStart : lines.length;
      
      // Parse all content types
      const recitals = parseRecitals(lines, lang, recitalsEndLine);
      const articles = parseArticles(lines, lang, articlesStartLine, articlesEndLine);
      const definitions = parseDefinitions(articles);
      const annexes = parseAnnexes(lines, lang, annexesStartLine);
      const footnotes = parseFootnotes(text);
       
       const parsed: ParsedContent = {
         articles,
         recitals,
        definitions,
        annexes,
        footnotes,
         detectedLanguage: lang,
       };
       
       setParsedContent(parsed);
       
       // Validate
       const validationResult = validateContent(parsed, source);
       setValidation(validationResult);
       
       if (validationResult.isValid) {
        toast.success(`Parsed ${articles.length} articles, ${recitals.length} recitals, ${definitions.length} definitions, ${annexes.length} annexes`);
       } else {
         toast.warning(`Parsed with ${validationResult.errors.length} errors - review before importing`);
       }
       
       return parsed;
     } catch (error) {
       toast.error('Failed to parse document: ' + (error as Error).message);
       return null;
     } finally {
       setIsParsing(false);
     }
  }, [englishSource, loadEnglishSource, detectLanguage, findSectionBoundaries, parseArticles, parseRecitals, parseDefinitions, parseAnnexes, parseFootnotes, validateContent]);
 
   // Import translations to database
   const importTranslations = useCallback(async (
     languageCode: string,
     selectedArticles: number[],
     selectedRecitals: number[]
   ) => {
     if (!parsedContent || !englishSource) {
       toast.error('No parsed content to import');
       return false;
     }
     
     setIsImporting(true);
     
     try {
       // Filter selected articles
       const articlesToImport = parsedContent.articles.filter(a => selectedArticles.includes(a.articleNumber));
       const recitalsToImport = parsedContent.recitals.filter(r => selectedRecitals.includes(r.recitalNumber));
       
       // Map to database format
       const articleTranslations = articlesToImport.map(article => {
         const sourceArticle = englishSource.articles.find(a => a.article_number === article.articleNumber);
         if (!sourceArticle) return null;
         
         return {
           article_id: sourceArticle.id,
           language_code: languageCode,
           title: article.title,
           content: article.content,
           is_published: false,
         };
       }).filter(Boolean);
       
       const recitalTranslations = recitalsToImport.map(recital => {
         const sourceRecital = englishSource.recitals.find(r => r.recital_number === recital.recitalNumber);
         if (!sourceRecital) return null;
         
         return {
           recital_id: sourceRecital.id,
           language_code: languageCode,
           content: recital.content,
           is_published: false,
         };
       }).filter(Boolean);
       
       // Upsert translations
       if (articleTranslations.length > 0) {
         const { error: articleError } = await supabase
           .from('article_translations')
           .upsert(articleTranslations as any[], {
             onConflict: 'article_id,language_code',
           });
         
         if (articleError) throw articleError;
       }
       
       if (recitalTranslations.length > 0) {
         const { error: recitalError } = await supabase
           .from('recital_translations')
           .upsert(recitalTranslations as any[], {
             onConflict: 'recital_id,language_code',
           });
         
         if (recitalError) throw recitalError;
       }
       
       toast.success(`Imported ${articleTranslations.length} articles and ${recitalTranslations.length} recitals`);
       return true;
     } catch (error) {
       toast.error('Failed to import translations: ' + (error as Error).message);
       return false;
     } finally {
       setIsImporting(false);
     }
   }, [parsedContent, englishSource]);
 
   // Reset state
   const reset = useCallback(() => {
     setParsedContent(null);
     setValidation(null);
   }, []);
 
   return {
     isParsing,
     isImporting,
     parsedContent,
     validation,
     englishSource,
     parseDocument,
     importTranslations,
     loadEnglishSource,
     reset,
   };
 }
 
 // Helper: Convert Roman numeral to number
 function romanToNumber(roman: string): number {
   const romanMap: Record<string, number> = {
     I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
   };
   
   let result = 0;
   const upper = roman.toUpperCase();
   
   for (let i = 0; i < upper.length; i++) {
     const current = romanMap[upper[i]] || 0;
     const next = romanMap[upper[i + 1]] || 0;
     
     if (current < next) {
       result -= current;
     } else {
       result += current;
     }
   }
   
   return result;
 }