import { Link } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Brain, GraduationCap, RotateCcw, CheckCircle2, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Layout from '@/components/Layout';
import { useStudyProgress, type StudyContentType } from '@/hooks/useStudyProgress';
import { useEhdsFaqs } from '@/hooks/useEhdsFaqs';
import { useArticles } from '@/hooks/useArticles';
import { useRecitals } from '@/hooks/useRecitals';
import { SEOHead } from '@/components/seo';

const CONTENT_TYPES: { key: StudyContentType; label: string; icon: typeof BookOpen; color: string }[] = [
  { key: 'faq', label: 'FAQs', icon: Brain, color: 'text-primary' },
  { key: 'article', label: 'Articles', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400' },
  { key: 'recital', label: 'Recitals', icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400' },
];

function ProgressRing({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--primary))" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export default function StudyModePage() {
  const { getProgressStats, getReviewItems, allProgress } = useStudyProgress();
  const { data: faqs } = useEhdsFaqs();
  const { data: articles } = useArticles();
  const { data: recitals } = useRecitals();

  const publishedFaqs = faqs?.filter(f => f.is_published) || [];
  const totalCounts = {
    faq: publishedFaqs.length,
    article: articles?.length || 0,
    recital: recitals?.length || 0,
  };

  const overallTotal = totalCounts.faq + totalCounts.article + totalCounts.recital;
  const overallCompleted = allProgress.filter(p => p.status === 'read' || p.status === 'mastered').length;
  const overallPercentage = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

  const reviewItems = getReviewItems();
  const faqChapters = [...new Set(publishedFaqs.map(f => f.chapter))];

  const studyModes = [
    {
      title: 'Reading Mode',
      description: 'Study FAQs, articles, and recitals chapter by chapter with progress tracking',
      icon: BookOpen,
      path: '/study/read',
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Flashcard Review',
      description: 'Test your recall with interactive flashcards and spaced repetition',
      icon: RotateCcw,
      path: '/study/flashcards',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Quiz Mode',
      description: 'Challenge yourself with auto-generated questions from FAQ content',
      icon: Brain,
      path: '/study/quiz',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <Layout>
      <SEOHead
        title="Study Mode — EHDS Explorer"
        description="Master the EHDS Regulation with interactive study tools: reading mode, flashcards, and quizzes."
        path="/study"
      />
      <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Study Mode
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Master the EHDS Regulation through reading, flashcards, and quizzes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing percentage={overallPercentage} />
            <div className="text-sm">
              <p className="font-medium">{overallCompleted} / {overallTotal}</p>
              <p className="text-muted-foreground">items studied</p>
            </div>
          </div>
        </div>

        {/* Content Type Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CONTENT_TYPES.map(({ key, label, icon: Icon, color }) => {
            const stats = getProgressStats(key);
            const total = totalCounts[key];
            const pct = total > 0 ? (stats.completed / total) * 100 : 0;
            return (
              <Card key={key}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <Progress value={pct} className="h-1.5 mt-1" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completed} / {total} completed
                      {stats.reviewing > 0 && ` · ${stats.reviewing} reviewing`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Study Modes */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Study Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyModes.map(mode => (
              <Link to={mode.path} key={mode.path}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mode.color} mb-2`}>
                      <mode.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {mode.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{mode.description}</CardDescription>
                    <div className="mt-3 flex items-center text-xs text-primary font-medium">
                      Start studying <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Items needing review */}
        {reviewItems.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" /> Items to Review ({reviewItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reviewItems.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">{item.content_type}</Badge>
                    <span className="text-muted-foreground">#{item.content_id}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Reviewed {item.review_count}x
                    </span>
                  </div>
                ))}
                {reviewItems.length > 5 && (
                  <Link to="/study/flashcards?filter=reviewing" className="text-xs text-primary hover:underline">
                    View all {reviewItems.length} items →
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick start: FAQ chapters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">FAQ Chapters</CardTitle>
            <CardDescription>Start reading official EHDS FAQs by chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {faqChapters.map(ch => {
                const chapterFaqs = publishedFaqs.filter(f => f.chapter === ch);
                const completed = chapterFaqs.filter(f => {
                  const s = allProgress.find(p => p.content_type === 'faq' && p.content_id === String(f.faq_number));
                  return s && (s.status === 'read' || s.status === 'mastered');
                }).length;
                return (
                  <Link key={ch} to={`/study/read?type=faq&chapter=${encodeURIComponent(ch)}`}>
                    <Badge variant={completed === chapterFaqs.length && chapterFaqs.length > 0 ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/10 transition-colors">
                      {ch} ({completed}/{chapterFaqs.length})
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
