import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RotateCcw, ArrowLeft, CheckCircle2, Eye, SkipForward, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { SEOHead } from '@/components/seo';
import { useStudyProgress, type StudyContentType } from '@/hooks/useStudyProgress';
import { useEhdsFaqs } from '@/hooks/useEhdsFaqs';
import { useArticles } from '@/hooks/useArticles';
import { useRecitals } from '@/hooks/useRecitals';

interface FlashcardItem {
  type: StudyContentType;
  id: string;
  number: number;
  front: string;
  back: string;
  chapter?: string;
}

export default function StudyFlashcardsPage() {
  const [searchParams] = useSearchParams();
  const filterReviewing = searchParams.get('filter') === 'reviewing';

  const [activeTab, setActiveTab] = useState<StudyContentType | 'all'>('faq');
  const [revealed, setRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, gotIt: 0, needsReview: 0 });

  const { getStatus, updateProgress, getReviewItems } = useStudyProgress();
  const { data: faqs } = useEhdsFaqs();
  const { data: articles } = useArticles();
  const { data: recitals } = useRecitals();

  const publishedFaqs = useMemo(() => faqs?.filter(f => f.is_published) || [], [faqs]);

  const cards: FlashcardItem[] = useMemo(() => {
    let items: FlashcardItem[] = [];

    if (activeTab === 'faq' || activeTab === 'all') {
      items.push(...publishedFaqs.map(f => ({
        type: 'faq' as const, id: String(f.faq_number), number: f.faq_number,
        front: f.question, back: f.rich_content || f.answer, chapter: f.chapter,
      })));
    }
    if (activeTab === 'article' || activeTab === 'all') {
      items.push(...(articles || []).map(a => ({
        type: 'article' as const, id: String(a.id), number: a.article_number,
        front: `Article ${a.article_number}: ${a.title}`, back: a.content,
      })));
    }
    if (activeTab === 'recital' || activeTab === 'all') {
      items.push(...(recitals || []).map(r => ({
        type: 'recital' as const, id: String(r.id), number: r.recital_number,
        front: `Recital ${r.recital_number}`, back: r.content,
      })));
    }

    if (filterReviewing) {
      const reviewIds = new Set(getReviewItems().map(r => `${r.content_type}-${r.content_id}`));
      items = items.filter(i => reviewIds.has(`${i.type}-${i.id}`));
    }

    // Shuffle for spaced repetition feel — items marked "reviewing" appear first
    return items.sort((a, b) => {
      const aStatus = getStatus(a.type, a.id);
      const bStatus = getStatus(b.type, b.id);
      if (aStatus === 'reviewing' && bStatus !== 'reviewing') return -1;
      if (bStatus === 'reviewing' && aStatus !== 'reviewing') return 1;
      if (aStatus === 'unread' && bStatus !== 'unread') return -1;
      if (bStatus === 'unread' && aStatus !== 'unread') return 1;
      return 0;
    });
  }, [activeTab, publishedFaqs, articles, recitals, filterReviewing, getStatus, getReviewItems]);

  const currentCard = cards[currentIndex];
  const pct = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const advance = useCallback(() => {
    setRevealed(false);
    if (currentIndex < cards.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, cards.length]);

  const handleRating = async (rating: 'got_it' | 'needs_review' | 'skip') => {
    if (!currentCard) return;
    if (rating === 'got_it') {
      await updateProgress(currentCard.type, currentCard.id, 'mastered');
      setSessionStats(s => ({ ...s, reviewed: s.reviewed + 1, gotIt: s.gotIt + 1 }));
    } else if (rating === 'needs_review') {
      await updateProgress(currentCard.type, currentCard.id, 'reviewing');
      setSessionStats(s => ({ ...s, reviewed: s.reviewed + 1, needsReview: s.needsReview + 1 }));
    }
    advance();
  };


  return (
    <Layout>
      <SEOHead title="Flashcards — Study" description="Review EHDS content with interactive flashcards." />
      <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <Link to="/study">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold font-serif flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" /> Flashcard Review
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as StudyContentType | 'all'); setCurrentIndex(0); setRevealed(false); }}>
            <TabsList>
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="article">Articles</TabsTrigger>
              <TabsTrigger value="recital">Recitals</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-xs text-muted-foreground ml-auto">
            {currentIndex + 1} / {cards.length} cards
          </div>
        </div>

        <Progress value={pct} className="h-1.5" />

        {/* Session stats */}
        {sessionStats.reviewed > 0 && (
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> {sessionStats.gotIt} got it</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-amber-500" /> {sessionStats.needsReview} reviewing</span>
          </div>
        )}

        {currentCard ? (
          <>
            <Card
              className="min-h-[300px] flex flex-col cursor-pointer transition-all hover:shadow-md"
              onClick={() => setRevealed(!revealed)}
            >
              <CardContent className="flex-1 flex flex-col justify-center p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {currentCard.type.toUpperCase()} #{currentCard.number}
                  </Badge>
                  {currentCard.chapter && (
                    <Badge variant="secondary" className="text-xs">{currentCard.chapter}</Badge>
                  )}
                </div>

                <h2 className="text-lg font-semibold mb-4">{currentCard.front}</h2>

                {revealed ? (
                  <div className="border-t pt-4 mt-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-[12]">
                      {currentCard.back.replace(/[#*_`]/g, '').slice(0, 800)}
                      {currentCard.back.length > 800 && '...'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tap to reveal answer</p>
                )}
              </CardContent>
            </Card>

            {revealed && (
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => handleRating('skip')} className="gap-1">
                  <SkipForward className="h-4 w-4" /> Skip
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRating('needs_review')}
                  className="gap-1 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950">
                  <ThumbsDown className="h-4 w-4" /> Needs Review
                </Button>
                <Button size="sm" onClick={() => handleRating('got_it')} className="gap-1">
                  <ThumbsUp className="h-4 w-4" /> Got It
                </Button>
              </div>
            )}
          </>
        ) : cards.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No flashcards available for this filter.
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary mb-3" />
            <h2 className="text-lg font-semibold">Session Complete!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You reviewed {sessionStats.reviewed} cards — {sessionStats.gotIt} mastered, {sessionStats.needsReview} for review.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => { setCurrentIndex(0); setRevealed(false); setSessionStats({ reviewed: 0, gotIt: 0, needsReview: 0 }); }}>
                Restart
              </Button>
              <Link to="/study"><Button>Back to Study Hub</Button></Link>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
