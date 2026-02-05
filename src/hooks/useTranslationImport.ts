 import { useState, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 // Multi-language article patterns
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
 
 // Multi-language recital patterns (numbered paragraphs at start)
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
 
 // Chapter patterns with Roman numerals
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
 
 export interface ParsedContent {
   articles: ParsedArticle[];
   recitals: ParsedRecital[];
   detectedLanguage: string;
 }
 
 export interface ValidationResult {
   isValid: boolean;
   errors: string[];
   warnings: string[];
   articleCount: number;
   recitalCount: number;
   missingArticles: number[];
   missingRecitals: number[];
   duplicateArticles: number[];
   duplicateRecitals: number[];
 }
 
 export interface EnglishSource {
   articles: Array<{ id: number; article_number: number; title: string; content: string }>;
   recitals: Array<{ id: number; recital_number: number; content: string }>;
 }
 
 export function useTranslationImport() {
   const [isParsing, setIsParsing] = useState(false);
   const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
   const [validation, setValidation] = useState<ValidationResult | null>(null);
   const [englishSource, setEnglishSource] = useState<EnglishSource | null>(null);
   const [isImporting, setIsImporting] = useState(false);
 
   // Detect language from content patterns
   const detectLanguage = useCallback((text: string): string => {
     for (const [lang, pattern] of Object.entries(ARTICLE_PATTERNS)) {
       if (pattern.test(text)) {
         return lang;
       }
     }
     // Check chapter patterns as fallback
     for (const [lang, pattern] of Object.entries(CHAPTER_PATTERNS)) {
       if (pattern.test(text)) {
         return lang;
       }
     }
     return 'unknown';
   }, []);
 
   // Parse articles from text
   const parseArticles = useCallback((text: string, lang: string): ParsedArticle[] => {
     const articles: ParsedArticle[] = [];
     const pattern = ARTICLE_PATTERNS[lang] || ARTICLE_PATTERNS.en;
     const chapterPattern = CHAPTER_PATTERNS[lang] || CHAPTER_PATTERNS.en;
     
     // Split by article markers
     const lines = text.split('\n');
     let currentArticle: ParsedArticle | null = null;
     let currentChapter = 0;
     let contentLines: string[] = [];
     
     for (const line of lines) {
       const trimmedLine = line.trim();
       
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
           contentLines.push(line);
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
   const parseRecitals = useCallback((text: string, lang: string): ParsedRecital[] => {
     const recitals: ParsedRecital[] = [];
     const pattern = RECITAL_PATTERNS[lang] || RECITAL_PATTERNS.en;
     
     // Find the recitals section (usually before articles)
     const lines = text.split('\n');
     let currentRecital: ParsedRecital | null = null;
     let contentLines: string[] = [];
     let inRecitalsSection = false;
     
     for (const line of lines) {
       const trimmedLine = line.trim();
       
       // Detect start of recitals section
       if (/^HAS ADOPTED THIS REGULATION|^HAT FOLGENDE VERORDNUNG|^A ADOPTÉ LE PRÉSENT|^HA ADOPTADO EL PRESENTE/i.test(trimmedLine)) {
         inRecitalsSection = false;
         continue;
       }
       
       // Check for recital marker
       const recitalMatch = trimmedLine.match(pattern);
       if (recitalMatch) {
         inRecitalsSection = true;
         
         // Save previous recital
         if (currentRecital) {
           currentRecital.content = contentLines.join('\n').trim();
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
       } else if (currentRecital && inRecitalsSection) {
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
 
   // Load English source data for comparison
   const loadEnglishSource = useCallback(async () => {
     const [articlesRes, recitalsRes] = await Promise.all([
       supabase.from('articles').select('id, article_number, title, content').order('article_number'),
       supabase.from('recitals').select('id, recital_number, content').order('recital_number'),
     ]);
 
     if (articlesRes.error || recitalsRes.error) {
       toast.error('Failed to load English source data');
       return null;
     }
 
     const source: EnglishSource = {
       articles: articlesRes.data || [],
       recitals: recitalsRes.data || [],
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
     
     return {
       isValid: errors.length === 0,
       errors,
       warnings,
       articleCount: parsed.articles.length,
       recitalCount: parsed.recitals.length,
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
       
       // Parse content
       const articles = parseArticles(text, lang);
       const recitals = parseRecitals(text, lang);
       
       const parsed: ParsedContent = {
         articles,
         recitals,
         detectedLanguage: lang,
       };
       
       setParsedContent(parsed);
       
       // Validate
       const validationResult = validateContent(parsed, source);
       setValidation(validationResult);
       
       if (validationResult.isValid) {
         toast.success(`Successfully parsed ${articles.length} articles and ${recitals.length} recitals`);
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
   }, [englishSource, loadEnglishSource, detectLanguage, parseArticles, parseRecitals, validateContent]);
 
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