import { useState, useCallback, useRef } from 'react';
import { Globe, Loader2, Check, X, Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { firecrawlApi } from '@/lib/api/firecrawl';
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

  const generateUrl = (langCode: string) => {
    const eurLexLang = LANG_MAP[langCode] || 'EN';
    return `https://eur-lex.europa.eu/legal-content/${eurLexLang}/TXT/HTML/?uri=CELEX:${celexNumber}`;
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
  ): Promise<{ articles: number; recitals: number }> => {
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

    return { articles: articleTranslations.length, recitals: recitalTranslations.length };
  };

  const checkExistingTranslations = async (langCode: string): Promise<boolean> => {
    const { count } = await supabase
      .from('article_translations')
      .select('id', { count: 'exact', head: true })
      .eq('language_code', langCode);
    return (count || 0) > 50; // Consider "done" if >50 articles already translated
  };

  const startBatch = useCallback(async () => {
    cancelRef.current = false;
    pauseRef.current = false;
    setIsRunning(true);
    setIsPaused(false);

    const languages = Object.keys(LANG_MAP);
    const initialStatuses: LanguageStatus[] = languages.map(code => ({
      code,
      status: 'pending',
      articles: 0,
      recitals: 0,
    }));
    setStatuses(initialStatuses);

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

      // Check if already translated
      const exists = await checkExistingTranslations(langCode);
      if (exists) {
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'skipped' } : s
        ));
        continue;
      }

      try {
        // Fetch
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'fetching' } : s
        ));

        const url = generateUrl(langCode);
        const response = await firecrawlApi.scrape(url, {
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
        });

        if (!response.success || !response.data?.markdown) {
          throw new Error(response.error || 'Empty content');
        }

        const content = response.data.markdown;
        if (content.length < 1000) {
          throw new Error('Content too short - page may not have loaded');
        }

        // Parse
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'parsing' } : s
        ));

        const { content: parsed } = await parseDocumentAdaptive(content);

        if (parsed.articles.length < 10 || parsed.recitals.length < 10) {
          throw new Error(`Low parse count: ${parsed.articles.length} articles, ${parsed.recitals.length} recitals`);
        }

        // Import
        setStatuses(prev => prev.map(s =>
          s.code === langCode ? { ...s, status: 'importing' } : s
        ));

        const result = await importLanguage(langCode, parsed, source);

        setStatuses(prev => prev.map(s =>
          s.code === langCode
            ? { ...s, status: 'done', articles: result.articles, recitals: result.recitals }
            : s
        ));
      } catch (err) {
        console.error(`Failed for ${langCode}:`, err);
        setStatuses(prev => prev.map(s =>
          s.code === langCode
            ? { ...s, status: 'error', error: (err as Error).message }
            : s
        ));
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
          <Button onClick={startBatch} className="w-full" size="lg">
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
                <div key={s.code} className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-muted/50">
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
                        {s.articles}A / {s.recitals}R
                      </Badge>
                    )}
                    {s.status === 'error' && (
                      <Badge variant="destructive" className="text-xs" title={s.error}>
                        <X className="h-3 w-3 mr-1" />Error
                      </Badge>
                    )}
                    {s.status === 'skipped' && <Badge variant="outline" className="text-xs">Skipped</Badge>}
                  </div>
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
