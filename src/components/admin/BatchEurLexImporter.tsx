import { useState, useCallback, useRef } from 'react';
import { Globe, Loader2, Check, X, Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { parseDocumentAdaptive, type ParsedContent } from '@/hooks/useAdaptiveParser';
import { supabase } from '@/integrations/supabase/client';

const LANG_MAP: Record<string, string> = {
  de: 'DE', fr: 'FR', es: 'ES', it: 'IT', pt: 'PT', nl: 'NL',
  pl: 'PL', cs: 'CS', sk: 'SK', hu: 'HU', ro: 'RO', bg: 'BG',
  el: 'EL', sv: 'SV', da: 'DA', fi: 'FI', et: 'ET', lv: 'LV',
  lt: 'LT', sl: 'SL', hr: 'HR', mt: 'MT', ga: 'GA',
};

const LANG_NAMES: Record<string, string> = {
  de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', pt: 'Portuguese',
  nl: 'Dutch', pl: 'Polish', cs: 'Czech', sk: 'Slovak', hu: 'Hungarian',
  ro: 'Romanian', bg: 'Bulgarian', el: 'Greek', sv: 'Swedish', da: 'Danish',
  fi: 'Finnish', et: 'Estonian', lv: 'Latvian', lt: 'Lithuanian', sl: 'Slovenian',
  hr: 'Croatian', mt: 'Maltese', ga: 'Irish',
};

interface LanguageStatus {
  code: string;
  status: 'pending' | 'fetching' | 'parsing' | 'importing' | 'done' | 'error' | 'skipped';
  articles: number;
  recitals: number;
  definitions: number;
  annexes: number;
  footnotes: number;
  error?: string;
}

interface EnglishSource {
  articles: Array<{ id: number; article_number: number; title: string; content: string }>;
  recitals: Array<{ id: number; recital_number: number; content: string }>;
  definitions: Array<{ id: number; term: string; definition: string }>;
  annexes: Array<{ id: string; title: string; content: string }>;
}

interface BatchEurLexImporterProps {
  celexNumber?: string;
  onComplete?: () => void;
}

export function BatchEurLexImporter({ celexNumber = '32025R0327', onComplete }: BatchEurLexImporterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statuses, setStatuses] = useState<LanguageStatus[]>([]);
  const [currentLang, setCurrentLang] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const cancelRef = useRef(false);
  const pauseRef = useRef(false);

  const fetchWithFallback = async (langCode: string): Promise<{ content: string; htmlContent?: string; urlUsed: string }> => {
    const { data, error } = await supabase.functions.invoke('fetch-eurlex-body', {
      body: {
        celexNumber,
        languageCode: langCode,
      },
    });

    if (error) {
      throw new Error(`Backend fetch failed for ${langCode.toUpperCase()}: ${error.message}`);
    }

    const payload = data as {
      success?: boolean;
      error?: string;
      content?: string;
      html?: string;
      urlUsed?: string;
    } | null;

    if (!payload?.success) {
      throw new Error(payload?.error || `Failed to fetch EUR-Lex body for ${langCode.toUpperCase()}`);
    }

    const content = payload.content || '';
    if (!content || content.length < 1000) {
      throw new Error(
        `Fetched content too short for ${langCode.toUpperCase()} (${content.length} chars, url: ${payload.urlUsed || 'n/a'})`
      );
    }

    return {
      content,
      htmlContent: payload.html,
      urlUsed: payload.urlUsed || 'n/a',
    };
  };

  const loadEnglishSource = async (): Promise<EnglishSource | null> => {
    const [articlesRes, recitalsRes, definitionsRes, annexesRes] = await Promise.all([
      supabase.from('articles').select('id, article_number, title, content').order('article_number'),
      supabase.from('recitals').select('id, recital_number, content').order('recital_number'),
      supabase.from('definitions').select('id, term, definition').order('id'),
      supabase.from('annexes').select('id, title, content'),
    ]);

    if (articlesRes.error || recitalsRes.error) return null;
    return {
      articles: articlesRes.data || [],
      recitals: recitalsRes.data || [],
      definitions: definitionsRes.data || [],
      annexes: annexesRes.data || [],
    };
  };

  const importLanguage = async (
    langCode: string,
    parsed: ParsedContent,
    source: EnglishSource
  ): Promise<{ articles: number; recitals: number; definitions: number; annexes: number; footnotes: number }> => {
    // Map articles
    const articleTranslations = parsed.articles
      .map(article => {
        const src = source.articles.find(a => a.article_number === article.articleNumber);
        if (!src) return null;
        return {
          article_id: src.id,
          language_code: langCode,
          title: article.title,
          content: article.content,
          is_published: false,
        };
      })
      .filter(Boolean);

    // Map recitals
    const recitalTranslations = parsed.recitals
      .map(recital => {
        const src = source.recitals.find(r => r.recital_number === recital.recitalNumber);
        if (!src) return null;
        return {
          recital_id: src.id,
          language_code: langCode,
          content: recital.content,
          is_published: false,
        };
      })
      .filter(Boolean);

    // Map definitions
    const definitionTranslations = parsed.definitions
      .map(def => {
        const src = source.definitions.find(d => d.id === def.definitionNumber);
        if (!src) return null;
        return {
          definition_id: src.id,
          language_code: langCode,
          term: def.term,
          definition: def.definition,
          is_published: false,
        };
      })
      .filter(Boolean);

    // Map annexes
    const annexTranslations = parsed.annexes
      .map(annex => {
        const src = source.annexes.find(a =>
          a.id.toLowerCase().includes(annex.romanNumeral.toLowerCase()) ||
          a.title.toLowerCase().includes(annex.romanNumeral.toLowerCase())
        );
        if (!src) return null;
        return {
          annex_id: src.id,
          language_code: langCode,
          title: annex.title,
          content: annex.content,
          is_published: false,
        };
      })
      .filter(Boolean);

    // Handle footnotes
    let footnoteCount = 0;
    if (parsed.footnotes.length > 0) {
      const { data: existingFootnotes } = await supabase
        .from('footnotes')
        .select('id, marker');

      // Create missing base footnotes
      const missingFootnotes = parsed.footnotes.filter(
        fn => !existingFootnotes?.find(ef => ef.marker === fn.marker)
      );

      let newFootnoteMap: Record<string, string> = {};
      if (missingFootnotes.length > 0) {
        const { data: created } = await supabase
          .from('footnotes')
          .insert(missingFootnotes.map(fn => ({
            marker: fn.marker,
            content: fn.content,
            article_id: null,
            recital_id: null,
          })))
          .select('id, marker');
        created?.forEach(fn => { newFootnoteMap[fn.marker] = fn.id; });
      }

      const footnoteTranslations = parsed.footnotes
        .map(fn => {
          const existing = existingFootnotes?.find(ef => ef.marker === fn.marker);
          const footnoteId = existing?.id || newFootnoteMap[fn.marker];
          if (!footnoteId) return null;
          return {
            footnote_id: footnoteId,
            language_code: langCode,
            content: fn.content,
            is_published: false,
          };
        })
        .filter(Boolean);

      if (footnoteTranslations.length > 0) {
        const { error } = await supabase
          .from('footnote_translations')
          .upsert(footnoteTranslations as any[], { onConflict: 'footnote_id,language_code' });
        if (error) console.error('Footnote import error:', error);
        else footnoteCount = footnoteTranslations.length;
      }
    }

    if (articleTranslations.length > 0) {
      const { error } = await supabase
        .from('article_translations')
        .upsert(articleTranslations as any[], { onConflict: 'article_id,language_code' });
      if (error) throw error;
    }

    if (recitalTranslations.length > 0) {
      const { error } = await supabase
        .from('recital_translations')
        .upsert(recitalTranslations as any[], { onConflict: 'recital_id,language_code' });
      if (error) throw error;
    }

    if (definitionTranslations.length > 0) {
      const { error } = await supabase
        .from('definition_translations')
        .upsert(definitionTranslations as any[], { onConflict: 'definition_id,language_code' });
      if (error) console.error('Definition import error:', error);
    }

    if (annexTranslations.length > 0) {
      const { error } = await supabase
        .from('annex_translations')
        .upsert(annexTranslations as any[], { onConflict: 'annex_id,language_code' });
      if (error) console.error('Annex import error:', error);
    }

    return {
      articles: articleTranslations.length,
      recitals: recitalTranslations.length,
      definitions: definitionTranslations.length,
      annexes: annexTranslations.length,
      footnotes: footnoteCount,
    };
  };

  const checkExistingTranslations = async (langCode: string): Promise<boolean> => {
    const { count } = await supabase
      .from('article_translations')
      .select('id', { count: 'exact', head: true })
      .eq('language_code', langCode);
    return (count || 0) > 50; // Consider "done" if >50 articles already translated
  };

  const startBatch = useCallback(async (onlyLanguages?: string[]) => {
    cancelRef.current = false;
    pauseRef.current = false;
    setIsRunning(true);
    setIsPaused(false);

    const languages = onlyLanguages || Object.keys(LANG_MAP);
    
    // If retrying specific languages, keep existing statuses and reset only those
    if (onlyLanguages) {
      setStatuses(prev => {
        const existing = new Map(prev.map(s => [s.code, s]));
        for (const code of onlyLanguages) {
          existing.set(code, {
            code,
            status: 'pending',
            articles: 0,
            recitals: 0,
            definitions: 0,
            annexes: 0,
            footnotes: 0,
          });
        }
        return Array.from(existing.values());
      });
    } else {
      const initialStatuses: LanguageStatus[] = languages.map(code => ({
        code,
        status: 'pending',
        articles: 0,
        recitals: 0,
        definitions: 0,
        annexes: 0,
        footnotes: 0,
      }));
      setStatuses(initialStatuses);
    }

    // Load English source
    const source = await loadEnglishSource();
    if (!source) {
      toast.error('Failed to load English source data');
      setIsRunning(false);
      return;
    }

    for (let i = 0; i < languages.length; i++) {
      if (cancelRef.current) break;

      // Wait while paused
      while (pauseRef.current && !cancelRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (cancelRef.current) break;

      const langCode = languages[i];
      setCurrentLang(langCode);
      setOverallProgress(Math.round((i / languages.length) * 100));

      // Check if already translated (skip only for full batch, not retries)
      if (!onlyLanguages) {
        const exists = await checkExistingTranslations(langCode);
        if (exists) {
          setStatuses(prev => prev.map(s =>
            s.code === langCode ? { ...s, status: 'skipped' } : s
          ));
          continue;
        }
      }

      try {
        // Fetch
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'fetching' } : s
        ));

        const { content, htmlContent, urlUsed } = await fetchWithFallback(langCode);
        console.log(`[${langCode}] Fetched ${content.length} chars from ${urlUsed}`);

        // Parse
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'parsing' } : s
        ));

        let parseResult = await parseDocumentAdaptive(content, { requestedLanguage: langCode });

        // Fallback: if text payload parses poorly, retry with HTML payload
        if (
          (parseResult.content.articles.length < 10 || parseResult.content.recitals.length < 10) &&
          htmlContent &&
          htmlContent.length > 1000
        ) {
          const htmlParseResult = await parseDocumentAdaptive(htmlContent, { requestedLanguage: langCode });
          const textScore = parseResult.content.articles.length + parseResult.content.recitals.length;
          const htmlScore = htmlParseResult.content.articles.length + htmlParseResult.content.recitals.length;

          if (htmlScore > textScore) {
            parseResult = htmlParseResult;
            console.log(`[${langCode}] Switched to HTML payload parse (${htmlScore} > ${textScore})`);
          }
        }

        const { content: parsed, analysis: parseAnalysis } = parseResult;

        console.log(`[${langCode}] Parse results:`, {
          articles: parsed.articles.length,
          recitals: parsed.recitals.length,
          definitions: parsed.definitions.length,
          annexes: parsed.annexes.length,
          footnotes: parsed.footnotes.length,
          language: parsed.detectedLanguage,
          analysis: parseAnalysis,
        });

        if (parsed.articles.length < 10 || parsed.recitals.length < 10) {
          throw new Error(`Low parse count for ${langCode.toUpperCase()}: ${parsed.articles.length} articles, ${parsed.recitals.length} recitals (parser detected: ${parsed.detectedLanguage}, url: ${urlUsed})`);
        }

        // Import
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'importing' } : s
        ));

        const result = await importLanguage(langCode, parsed, source);

        setStatuses(prev => prev.map(s =>
          s.code === langCode
            ? { ...s, status: 'done', articles: result.articles, recitals: result.recitals, definitions: result.definitions, annexes: result.annexes, footnotes: result.footnotes }
            : s
        ));
        // Log success to database
        await supabase.from('translation_import_logs').insert({
          language_code: langCode,
          status: 'done',
          articles_count: result.articles,
          recitals_count: result.recitals,
          definitions_count: result.definitions,
          annexes_count: result.annexes,
          footnotes_count: result.footnotes,
          parser_detected_language: parsed.detectedLanguage,
          content_length: content.length,
          source_url: urlUsed,
          import_type: 'batch',
        } as any);
      } catch (err) {
        const errorMsg = (err as Error).message;
        console.error(`Failed for ${langCode}:`, err);
        setStatuses(prev => prev.map(s =>
          s.code === langCode
            ? { ...s, status: 'error', error: errorMsg }
            : s
        ));
        // Log error to database
        await supabase.from('translation_import_logs').insert({
          language_code: langCode,
          status: 'error',
          error_message: errorMsg,
          import_type: 'batch',
        } as any);
      }

      // Small delay between requests to be respectful
      if (i < languages.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    setOverallProgress(100);
    setIsRunning(false);
    setCurrentLang(null);
    toast.success('Batch import complete!');
    onComplete?.();
  }, [celexNumber, onComplete]);

  const handlePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleSkip = () => {
    // Mark current as skipped - the loop will move to next
    if (currentLang) {
      setStatuses(prev => prev.map(s =>
        s.code === currentLang ? { ...s, status: 'skipped' } : s
      ));
    }
  };

  const doneCount = statuses.filter(s => s.status === 'done').length;
  const errorCount = statuses.filter(s => s.status === 'error').length;
  const skippedCount = statuses.filter(s => s.status === 'skipped').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Batch Import All Languages
        </CardTitle>
        <CardDescription>
          Automatically fetch, parse, and import all 23 EU language translations from EUR-Lex
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRunning && statuses.length === 0 && (
          <Button onClick={() => startBatch()} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start Batch Import (23 Languages)
          </Button>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Progress: </span>
                <Badge variant="secondary">{doneCount} done</Badge>
                {errorCount > 0 && <Badge variant="destructive" className="ml-1">{errorCount} errors</Badge>}
                {skippedCount > 0 && <Badge variant="outline" className="ml-1">{skippedCount} skipped</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSkip}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handlePause}>
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Progress value={overallProgress} className="h-2" />
            {currentLang && (
              <p className="text-sm text-muted-foreground">
                Currently processing: <Badge>{LANG_NAMES[currentLang]} ({currentLang.toUpperCase()})</Badge>
                {isPaused && <span className="ml-2 text-amber-500 font-medium">PAUSED</span>}
              </p>
            )}
          </div>
        )}

        {statuses.length > 0 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {statuses.map(s => (
                <div key={s.code} className="flex flex-col py-1.5 px-2 rounded text-sm hover:bg-muted/50 gap-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 font-mono text-xs">{s.code.toUpperCase()}</span>
                      <span className="text-muted-foreground">{LANG_NAMES[s.code]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === 'pending' && <Badge variant="outline" className="text-xs">Pending</Badge>}
                      {s.status === 'fetching' && <Badge className="text-xs bg-blue-500"><Loader2 className="h-3 w-3 animate-spin mr-1" />Fetching</Badge>}
                      {s.status === 'parsing' && <Badge className="text-xs bg-amber-500"><Loader2 className="h-3 w-3 animate-spin mr-1" />Parsing</Badge>}
                      {s.status === 'importing' && <Badge className="text-xs bg-purple-500"><Loader2 className="h-3 w-3 animate-spin mr-1" />Importing</Badge>}
                      {s.status === 'done' && (
                        <Badge className="text-xs bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          {s.articles}A / {s.recitals}R{s.definitions > 0 ? ` / ${s.definitions}D` : ''}{s.annexes > 0 ? ` / ${s.annexes}X` : ''}{s.footnotes > 0 ? ` / ${s.footnotes}F` : ''}
                        </Badge>
                      )}
                      {s.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">
                          <X className="h-3 w-3 mr-1" />Error
                        </Badge>
                      )}
                      {s.status === 'skipped' && <Badge variant="outline" className="text-xs">Skipped</Badge>}
                    </div>
                  </div>
                  {s.status === 'error' && s.error && (
                    <p className="text-xs text-destructive pl-8 break-all">{s.error}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {!isRunning && statuses.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStatuses([])} className="flex-1">
              Clear Results
            </Button>
            {errorCount > 0 && (
              <Button onClick={startBatch} className="flex-1">
                Retry Failed
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
