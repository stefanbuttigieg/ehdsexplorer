import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  parseDocumentAdaptive,
  type ParsedContent,
  type StructureAnalysis,
  type ParsedArticle,
  type ParsedRecital,
} from './useAdaptiveParser';

export interface ImplementingActImportResult {
  recitals: number;
  articles: number;
  sections: number;
}

export function useImplementingActImport() {
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null);
  const [structureAnalysis, setStructureAnalysis] = useState<StructureAnalysis | null>(null);

  const parseDocument = useCallback(async (text: string): Promise<ParsedContent | null> => {
    setIsParsing(true);
    setParsedContent(null);
    setStructureAnalysis(null);

    try {
      const { content: parsed, analysis } = await parseDocumentAdaptive(text);
      setStructureAnalysis(analysis);
      setParsedContent(parsed);

      toast.success(
        `Parsed ${parsed.articles.length} articles, ${parsed.recitals.length} recitals`
      );
      return parsed;
    } catch (error) {
      toast.error('Failed to parse: ' + (error as Error).message);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  const importToImplementingAct = useCallback(async (
    implementingActId: string,
    selectedArticles: number[],
    selectedRecitals: number[],
  ): Promise<ImplementingActImportResult | null> => {
    if (!parsedContent) {
      toast.error('No parsed content');
      return null;
    }

    setIsImporting(true);

    try {
      const recitalsToImport = parsedContent.recitals.filter(r => selectedRecitals.includes(r.recitalNumber));
      const articlesToImport = parsedContent.articles.filter(a => selectedArticles.includes(a.articleNumber));

      // Import recitals
      let recitalCount = 0;
      if (recitalsToImport.length > 0) {
        // Delete existing recitals for this implementing act first
        await supabase
          .from('implementing_act_recitals')
          .delete()
          .eq('implementing_act_id', implementingActId);

        const recitalRows = recitalsToImport.map(r => ({
          implementing_act_id: implementingActId,
          recital_number: r.recitalNumber,
          content: r.content,
        }));

        const { error } = await supabase
          .from('implementing_act_recitals')
          .insert(recitalRows);
        if (error) throw error;
        recitalCount = recitalRows.length;
      }

      // Import articles (detect sections from chapter info)
      let articleCount = 0;
      let sectionCount = 0;

      if (articlesToImport.length > 0) {
        // Delete existing articles
        await supabase
          .from('implementing_act_articles')
          .delete()
          .eq('implementing_act_id', implementingActId);

        // Delete existing sections
        await supabase
          .from('implementing_act_sections')
          .delete()
          .eq('implementing_act_id', implementingActId);

        // Create sections from chapters if detected
        const chapters = new Map<number, string>();
        for (const a of articlesToImport) {
          if (a.chapterNumber && !chapters.has(a.chapterNumber)) {
            chapters.set(a.chapterNumber, `Section ${a.chapterNumber}`);
          }
        }

        const sectionIdMap = new Map<number, string>();
        if (chapters.size > 0) {
          const sectionRows = Array.from(chapters.entries()).map(([num, title]) => ({
            implementing_act_id: implementingActId,
            section_number: num,
            title,
          }));

          const { data: insertedSections, error: secError } = await supabase
            .from('implementing_act_sections')
            .insert(sectionRows)
            .select('id, section_number');
          if (secError) throw secError;

          insertedSections?.forEach(s => {
            sectionIdMap.set(s.section_number, s.id);
          });
          sectionCount = sectionRows.length;
        }

        // Insert articles
        const articleRows = articlesToImport.map(a => ({
          implementing_act_id: implementingActId,
          article_number: a.articleNumber,
          title: a.title,
          content: a.content,
          section_id: a.chapterNumber ? sectionIdMap.get(a.chapterNumber) || null : null,
        }));

        const { error: artError } = await supabase
          .from('implementing_act_articles')
          .insert(articleRows);
        if (artError) throw artError;
        articleCount = articleRows.length;
      }

      const result = { recitals: recitalCount, articles: articleCount, sections: sectionCount };
      toast.success(`Imported ${articleCount} articles, ${recitalCount} recitals, ${sectionCount} sections`);
      return result;
    } catch (error) {
      toast.error('Import failed: ' + (error as Error).message);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [parsedContent]);

  const reset = useCallback(() => {
    setParsedContent(null);
    setStructureAnalysis(null);
  }, []);

  return {
    isParsing,
    isImporting,
    parsedContent,
    structureAnalysis,
    parseDocument,
    importToImplementingAct,
    reset,
    setParsedContent,
    setStructureAnalysis,
  };
}
