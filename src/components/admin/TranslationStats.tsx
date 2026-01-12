import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, BookOpen, Scale, Files, Layers, ListChecks, Newspaper } from 'lucide-react';

interface TranslationStatsProps {
  languageCode: string;
}

interface ContentStats {
  total: number;
  translated: number;
  published: number;
}

const TranslationStats = ({ languageCode }: TranslationStatsProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['translation-stats', languageCode],
    queryFn: async () => {
      // Fetch counts for each content type
      const [
        articlesRes,
        articleTransRes,
        recitalsRes,
        recitalTransRes,
        definitionsRes,
        definitionTransRes,
        annexesRes,
        annexTransRes,
        chaptersRes,
        chapterTransRes,
        sectionsRes,
        sectionTransRes,
        newsRes,
        newsTransRes,
      ] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        supabase.from('article_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
        supabase.from('recitals').select('id', { count: 'exact', head: true }),
        supabase.from('recital_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
        supabase.from('definitions').select('id', { count: 'exact', head: true }),
        supabase.from('definition_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
        supabase.from('annexes').select('id', { count: 'exact', head: true }),
        supabase.from('annex_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
        supabase.from('chapters').select('id', { count: 'exact', head: true }),
        supabase.from('chapter_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
        supabase.from('sections').select('id', { count: 'exact', head: true }),
        supabase.from('section_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
        supabase.from('news_summaries').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('news_summary_translations').select('id, is_published', { count: 'exact' }).eq('language_code', languageCode),
      ]);

      const countPublished = (data: any[] | null) => 
        data?.filter(d => d.is_published).length || 0;

      return {
        article: {
          total: articlesRes.count || 0,
          translated: articleTransRes.data?.length || 0,
          published: countPublished(articleTransRes.data),
        },
        recital: {
          total: recitalsRes.count || 0,
          translated: recitalTransRes.data?.length || 0,
          published: countPublished(recitalTransRes.data),
        },
        definition: {
          total: definitionsRes.count || 0,
          translated: definitionTransRes.data?.length || 0,
          published: countPublished(definitionTransRes.data),
        },
        annex: {
          total: annexesRes.count || 0,
          translated: annexTransRes.data?.length || 0,
          published: countPublished(annexTransRes.data),
        },
        chapter: {
          total: chaptersRes.count || 0,
          translated: chapterTransRes.data?.length || 0,
          published: countPublished(chapterTransRes.data),
        },
        section: {
          total: sectionsRes.count || 0,
          translated: sectionTransRes.data?.length || 0,
          published: countPublished(sectionTransRes.data),
        },
        news: {
          total: newsRes.count || 0,
          translated: newsTransRes.data?.length || 0,
          published: countPublished(newsTransRes.data),
        },
      };
    },
    enabled: !!languageCode,
  });

  const statItems = [
    { key: 'article', label: 'Articles', icon: FileText },
    { key: 'recital', label: 'Recitals', icon: BookOpen },
    { key: 'definition', label: 'Definitions', icon: Scale },
    { key: 'annex', label: 'Annexes', icon: Files },
    { key: 'chapter', label: 'Chapters', icon: Layers },
    { key: 'section', label: 'Sections', icon: Layers },
    { key: 'news', label: 'News', icon: Newspaper },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statItems.map((item) => (
          <Card key={item.key} className="animate-pulse">
            <CardContent className="p-3 sm:p-4">
              <div className="h-4 bg-muted rounded w-16 mb-2" />
              <div className="h-6 bg-muted rounded w-12 mb-2" />
              <div className="h-2 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {statItems.map((item) => {
        const stat = stats?.[item.key as keyof typeof stats] as ContentStats | undefined;
        const percent = stat?.total ? Math.round((stat.translated / stat.total) * 100) : 0;
        const Icon = item.icon;

        return (
          <Card key={item.key}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold">{stat?.translated || 0}</span>
                <span className="text-xs text-muted-foreground">/ {stat?.total || 0}</span>
              </div>
              <Progress value={percent} className="h-1.5 mb-1" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">{percent}%</span>
                {stat?.published ? (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    {stat.published} live
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TranslationStats;
