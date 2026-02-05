import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  parseDocumentAdaptive,
  saveSuccessfulPattern,
  type ParsedContent,
  type StructureAnalysis,
} from './useAdaptiveParser';

export type { ParsedContent, ParsedArticle, ParsedRecital, ParsedDefinition, ParsedAnnex, ParsedFootnote, StructureAnalysis } from './useAdaptiveParser';

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
  const [structureAnalysis, setStructureAnalysis] = useState<StructureAnalysis | null>(null);

  const englishSourceRef = useRef<EnglishSource | null>(null);
  englishSourceRef.current = englishSource;

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
    englishSourceRef.current = source;
    return source;
  }, []);

  // Main parse function using adaptive parser
  const parseDocument = useCallback(async (text: string): Promise<ParsedContent | null> => {
    setIsParsing(true);
    setParsedContent(null);
    setValidation(null);
    setStructureAnalysis(null);
    
    try {
      // Load English source if not loaded
      let source = englishSourceRef.current;
      if (!source) {
        source = await loadEnglishSource();
        if (!source) {
          throw new Error('Failed to load English source data');
        }
      }
      
      // Use adaptive parser
      const { content: parsed, analysis } = await parseDocumentAdaptive(text);
      setStructureAnalysis(analysis);
      
      console.log('Parsing results:', {
        recitals: parsed.recitals.length,
        articles: parsed.articles.length,
        definitions: parsed.definitions.length,
        annexes: parsed.annexes.length,
        footnotes: parsed.footnotes.length,
        language: parsed.detectedLanguage,
        analysis,
      });
      
      setParsedContent(parsed);
      
      // Validate
      const validationResult = validateContentFn(parsed, source);
      setValidation(validationResult);
      
      // Save pattern learning data
      const successRate = (parsed.recitals.length / source.recitals.length) * 0.5 + 
                         (parsed.articles.length / source.articles.length) * 0.5;
      const isSuccessful = successRate > 0.8;
      
      await saveSuccessfulPattern(
        parsed.detectedLanguage,
        analysis.tableFormat === 'two-column' ? 'eurlex-table' : 'eurlex-html',
        {
          articlePattern: analysis.articleCount > 50 ? 'standard' : undefined,
          recitalPattern: analysis.tableFormat,
        },
        isSuccessful
      );
      
      if (validationResult.isValid) {
        toast.success(`Parsed ${parsed.articles.length} articles, ${parsed.recitals.length} recitals, ${parsed.definitions.length} definitions, ${parsed.annexes.length} annexes, ${parsed.footnotes.length} footnotes`);
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
  }, [loadEnglishSource]);
 
 // Import translations to database
 const importTranslations = useCallback(async (
   languageCode: string,
   selectedArticles: number[],
   selectedRecitals: number[],
   selectedAnnexes: number[] = [],
   selectedFootnotes: number[] = []
 ) => {
   const currentParsedContent = parsedContent;
   const currentEnglishSource = englishSourceRef.current;
   
   if (!currentParsedContent || !currentEnglishSource) {
     toast.error('No parsed content to import');
     return false;
   }
   
   setIsImporting(true);
   
   try {
     // Filter selected items
     const articlesToImport = currentParsedContent.articles.filter(a => selectedArticles.includes(a.articleNumber));
     const recitalsToImport = currentParsedContent.recitals.filter(r => selectedRecitals.includes(r.recitalNumber));
     const annexesToImport = currentParsedContent.annexes.filter(a => selectedAnnexes.includes(a.annexNumber));
     const footnotesToImport = currentParsedContent.footnotes.filter((_, i) => selectedFootnotes.includes(i));
     
     // Map to database format - Articles
     const articleTranslations = articlesToImport.map(article => {
       const sourceArticle = currentEnglishSource.articles.find(a => a.article_number === article.articleNumber);
       if (!sourceArticle) return null;
       
       return {
         article_id: sourceArticle.id,
         language_code: languageCode,
         title: article.title,
         content: article.content,
         is_published: false,
       };
     }).filter(Boolean);
     
     // Map to database format - Recitals
     const recitalTranslations = recitalsToImport.map(recital => {
       const sourceRecital = currentEnglishSource.recitals.find(r => r.recital_number === recital.recitalNumber);
       if (!sourceRecital) return null;
       
       return {
         recital_id: sourceRecital.id,
         language_code: languageCode,
         content: recital.content,
         is_published: false,
       };
     }).filter(Boolean);

     // Map to database format - Annexes
     const annexTranslations = annexesToImport.map(annex => {
       // Try to find matching English annex by roman numeral
       const sourceAnnex = currentEnglishSource.annexes.find(a => 
         a.id.toLowerCase().includes(annex.romanNumeral.toLowerCase()) ||
         a.title.toLowerCase().includes(annex.romanNumeral.toLowerCase())
       );
       if (!sourceAnnex) return null;
       
       return {
         annex_id: sourceAnnex.id,
         language_code: languageCode,
         title: annex.title,
         content: annex.content,
         is_published: false,
       };
     }).filter(Boolean);

     // For footnotes, we need to first find or create the English footnote, then add translation
     // This requires a different approach - we'll try to match by marker
     const { data: existingFootnotes } = await supabase
       .from('footnotes')
       .select('id, marker');
     
     const footnoteTranslations: Array<{
       footnote_id: string;
       language_code: string;
       content: string;
       is_published: boolean;
     }> = [];

     for (const fn of footnotesToImport) {
       // Find existing footnote by marker
       const existingFn = existingFootnotes?.find(ef => ef.marker === fn.marker);
       
       if (existingFn) {
         // Add translation for existing footnote
         footnoteTranslations.push({
           footnote_id: existingFn.id,
           language_code: languageCode,
           content: fn.content,
           is_published: false,
         });
       } else {
         // Create the footnote first (with English placeholder), then add translation
         const { data: newFn, error: createError } = await supabase
           .from('footnotes')
           .insert({
             marker: fn.marker,
             content: `[Translation source: ${languageCode}] ${fn.content.slice(0, 100)}...`,
             article_id: null,
             recital_id: null,
           })
           .select('id')
           .single();
         
         if (createError) {
           console.error('Failed to create footnote:', createError);
           continue;
         }
         
         if (newFn) {
           footnoteTranslations.push({
             footnote_id: newFn.id,
             language_code: languageCode,
             content: fn.content,
             is_published: false,
           });
         }
       }
     }
     
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

     if (annexTranslations.length > 0) {
       const { error: annexError } = await supabase
         .from('annex_translations')
         .upsert(annexTranslations as any[], {
           onConflict: 'annex_id,language_code',
         });
       
       if (annexError) throw annexError;
     }

     if (footnoteTranslations.length > 0) {
       const { error: footnoteError } = await supabase
         .from('footnote_translations')
         .upsert(footnoteTranslations, {
           onConflict: 'footnote_id,language_code',
         });
       
       if (footnoteError) throw footnoteError;
     }
     
     const parts = [];
     if (articleTranslations.length > 0) parts.push(`${articleTranslations.length} articles`);
     if (recitalTranslations.length > 0) parts.push(`${recitalTranslations.length} recitals`);
     if (annexTranslations.length > 0) parts.push(`${annexTranslations.length} annexes`);
     if (footnoteTranslations.length > 0) parts.push(`${footnoteTranslations.length} footnotes`);
     
     toast.success(`Imported ${parts.join(', ')}`);
     return true;
   } catch (error) {
     toast.error('Failed to import translations: ' + (error as Error).message);
     return false;
   } finally {
     setIsImporting(false);
   }
 }, [parsedContent]);
 
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
    structureAnalysis,
    parseDocument,
    importTranslations,
    loadEnglishSource,
    reset,
    setParsedContent,
    setStructureAnalysis,
  };
}

// Validation function - kept locally since it needs EnglishSource type
 
 function validateContentFn(parsed: ParsedContent, source: EnglishSource): ValidationResult {
   const errors: string[] = [];
   const warnings: string[] = [];
   
   const expectedArticles = source.articles.map(a => a.article_number);
   const expectedRecitals = source.recitals.map(r => r.recital_number);
   
   const parsedArticleNumbers = parsed.articles.map(a => a.articleNumber);
   const parsedRecitalNumbers = parsed.recitals.map(r => r.recitalNumber);
   
   const missingArticles = expectedArticles.filter(n => !parsedArticleNumbers.includes(n));
   const missingRecitals = expectedRecitals.filter(n => !parsedRecitalNumbers.includes(n));
   
   const duplicateArticles = parsedArticleNumbers.filter((n, i) => parsedArticleNumbers.indexOf(n) !== i);
   const duplicateRecitals = parsedRecitalNumbers.filter((n, i) => parsedRecitalNumbers.indexOf(n) !== i);
   
   const extraArticles = parsedArticleNumbers.filter(n => !expectedArticles.includes(n));
   const extraRecitals = parsedRecitalNumbers.filter(n => !expectedRecitals.includes(n));
   
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
   
   const shortArticles = parsed.articles.filter(a => a.content.length < 50);
   if (shortArticles.length > 5) {
     warnings.push(`${shortArticles.length} articles have very short content (< 50 chars) - may indicate parsing issues`);
   }
 
   if (parsed.definitions.length > 0) {
     if (parsed.definitions.length !== source.definitions.length) {
       warnings.push(`Definition count: found ${parsed.definitions.length}, source has ${source.definitions.length}`);
     }
   }
 
   if (parsed.annexes.length > 0) {
     if (parsed.annexes.length !== source.annexes.length) {
       warnings.push(`Annex count: found ${parsed.annexes.length}, source has ${source.annexes.length}`);
     }
   }
 
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
 }