import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';
import { SEOHead } from '@/components/seo';
import { useStudyProgress, type StudyContentType } from '@/hooks/useStudyProgress';
import { useEhdsFaqs } from '@/hooks/useEhdsFaqs';
import { useArticles } from '@/hooks/useArticles';
import { useRecitals } from '@/hooks/useRecitals';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StudyItem {
  type: StudyContentType;
  id: string;
  number: number;
  title: string;
  content: string;
  chapter?: string;
  sourceRefs?: string[];
}

export default function StudyReadPage() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as StudyContentType) || 'faq';
  const initialChapter = searchParams.get('chapter') || '';

  const [activeTab, setActiveTab] = useState<StudyContentType>(initialType);
  const [chapterFilter, setChapterFilter] = useState(initialChapter);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { getStatus, updateProgress } = useStudyProgress();
  const { data: faqs } = useEhdsFaqs();
  const { data: articles } = useArticles();
  const { data: recitals } = useRecitals();

  const publishedFaqs = useMemo(() => faqs?.filter(f => f.is_published) || [], [faqs]);
  const faqChapters = [...new Set(publishedFaqs.map(f => f.chapter))];

  const items: StudyItem[] = useMemo(() => {
    if (activeTab === 'faq') {
      let filtered = publishedFaqs;
      if (chapterFilter) filtered = filtered.filter(f => f.chapter === chapterFilter);
      return filtered
        .sort((a, b) => a.faq_number - b.faq_number)
        .map(f => ({
          type: 'faq' as const,
          id: String(f.faq_number),
          number: f.faq_number,
          title: f.question,
          content: f.rich_content || f.answer,
          chapter: f.chapter,
          sourceRefs: [...(f.source_articles || []), ...(f.source_recitals || [])],
        }));
    }
    if (activeTab === 'article') {
      return (articles || [])
        .sort((a, b) => a.article_number - b.article_number)
        .map(a => ({
          type: 'article' as const,
          id: String(a.id),
          number: a.article_number,
          title: a.title,
          content: a.content,
        }));
    }
    return (recitals || [])
      .sort((a, b) => a.recital_number - b.recital_number)
      .map(r => ({
        type: 'recital' as const,
        id: String(r.id),
        number: r.recital_number,
        title: `Recital ${r.recital_number}`,
        content: r.content,
      }));
  }, [activeTab, chapterFilter, publishedFaqs, articles, recitals]);

  const currentItem = items[currentIndex];
  const completed = items.filter(item => {
    const s = getStatus(item.type, item.id);
    return s === 'read' || s === 'mastered';
  }).length;
  const pct = items.length > 0 ? (completed / items.length) * 100 : 0;

  const handleMark = async (status: 'read' | 'reviewing') => {
    if (!currentItem) return;
    await updateProgress(currentItem.type, currentItem.id, status);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1);
  };
  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as StudyContentType);
    setCurrentIndex(0);
    setChapterFilter('');
  };

  return (
    <Layout>
      <SEOHead title="Reading Mode — Study" description="Read through EHDS content systematically." />
      <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/study">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold font-serif">Reading Mode</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="recital">Recitals</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'faq' && faqChapters.length > 0 && (
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <Badge variant={!chapterFilter ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap shrink-0"
                onClick={() => { setChapterFilter(''); setCurrentIndex(0); }}>
                All
              </Badge>
              {faqChapters.map(ch => (
                <Badge key={ch} variant={chapterFilter === ch ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap shrink-0"
                  onClick={() => { setChapterFilter(ch); setCurrentIndex(0); }}>
                  {ch}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{completed}/{items.length}</span>
        </div>

        {/* Content Card */}
        {currentItem ? (
          <Card className="min-h-[50vh]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{currentItem.type.toUpperCase()} #{currentItem.number}</Badge>
                {currentItem.chapter && (
                  <Badge variant="secondary" className="text-xs">{currentItem.chapter}</Badge>
                )}
                {getStatus(currentItem.type, currentItem.id) !== 'unread' && (
                  <Badge variant={getStatus(currentItem.type, currentItem.id) === 'mastered' ? 'default' : 'secondary'}
                    className="text-xs ml-auto">
                    {getStatus(currentItem.type, currentItem.id)}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-snug mt-2">{currentItem.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentItem.content}
                </ReactMarkdown>
              </div>

              {currentItem.sourceRefs && currentItem.sourceRefs.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Source references:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentItem.sourceRefs.map((ref, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{ref}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            No items found for this filter.
          </Card>
        )}

        {/* Navigation */}
        {currentItem && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={currentIndex >= items.length - 1}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMark('reviewing')}>
                <Eye className="h-4 w-4 mr-1" /> Needs Review
              </Button>
              <Button size="sm" onClick={() => { handleMark('read'); handleNext(); }}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Read & Next
              </Button>
            </div>
          </div>
        )}

        {/* Item list sidebar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">All Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {items.map((item, i) => {
                  const status = getStatus(item.type, item.id);
                  return (
                    <button key={`${item.type}-${item.id}`}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-full text-left text-xs p-1.5 rounded flex items-center gap-2 hover:bg-muted transition-colors ${
                        i === currentIndex ? 'bg-primary/10 font-medium' : ''
                      }`}>
                      {status === 'read' || status === 'mastered' ? (
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      ) : status === 'reviewing' ? (
                        <Eye className="h-3 w-3 text-amber-500 shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border shrink-0" />
                      )}
                      <span className="truncate">#{item.number} {item.title}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
