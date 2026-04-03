import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowLeft, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { SEOHead } from '@/components/seo';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useEhdsFaqs } from '@/hooks/useEhdsFaqs';

interface QuizQuestion {
  faqNumber: number;
  question: string;
  correctAnswer: string;
  options: string[];
  chapter: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateDistractors(correctAnswer: string, allAnswers: string[]): string[] {
  const others = allAnswers.filter(a => a !== correctAnswer);
  const shuffled = shuffleArray(others);
  return shuffled.slice(0, 3);
}

function truncateAnswer(text: string, maxLen = 120): string {
  const clean = text.replace(/[#*_`\n]/g, ' ').replace(/\s+/g, ' ').trim();
  const firstSentence = clean.split(/[.!?]/)[0];
  const result = firstSentence.length > maxLen ? firstSentence.slice(0, maxLen) + '…' : firstSentence;
  return result || clean.slice(0, maxLen);
}

export default function StudyQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [reviewList, setReviewList] = useState<number[]>([]);

  const { updateProgress } = useStudyProgress();
  const { data: faqs } = useEhdsFaqs();

  const publishedFaqs = useMemo(() => (faqs || []).filter(f => f.is_published), [faqs]);

  const questions: QuizQuestion[] = useMemo(() => {
    if (publishedFaqs.length < 4) return [];
    const allAnswers = publishedFaqs.map(f => truncateAnswer(f.rich_content || f.answer));
    
    return shuffleArray(publishedFaqs).slice(0, 20).map(faq => {
      const correct = truncateAnswer(faq.rich_content || faq.answer);
      const distractors = generateDistractors(correct, allAnswers);
      return {
        faqNumber: faq.faq_number,
        question: faq.question,
        correctAnswer: correct,
        options: shuffleArray([correct, ...distractors]),
        chapter: faq.chapter,
      };
    });
  }, [publishedFaqs]);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const pct = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const isFinished = currentIndex >= total && total > 0;

  const handleSubmit = async () => {
    if (!currentQ || !selectedAnswer) return;
    setAnswered(true);
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    if (isCorrect) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
      await updateProgress('faq', String(currentQ.faqNumber), 'mastered');
    } else {
      setScore(s => ({ ...s, incorrect: s.incorrect + 1 }));
      setReviewList(r => [...r, currentQ.faqNumber]);
      await updateProgress('faq', String(currentQ.faqNumber), 'reviewing');
    }
  };

  const handleNext = () => {
    setAnswered(false);
    setSelectedAnswer('');
    setCurrentIndex(currentIndex + 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswered(false);
    setSelectedAnswer('');
    setScore({ correct: 0, incorrect: 0 });
    setReviewList([]);
  };

  return (
    <Layout>
      <SEOHead title="Quiz Mode — Study" description="Test your EHDS knowledge with interactive quizzes." path="/study/quiz" />
      <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <Link to="/study">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold font-serif flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> Quiz Mode
          </h1>
        </div>

        {total === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Not enough FAQs to generate a quiz. At least 4 published FAQs are required.
          </Card>
        ) : isFinished ? (
          <Card className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Quiz Complete!</h2>
            <p className="text-2xl font-bold text-primary">
              {score.correct} / {score.correct + score.incorrect}
            </p>
            <p className="text-sm text-muted-foreground">
              {Math.round((score.correct / (score.correct + score.incorrect)) * 100)}% correct
            </p>

            {reviewList.length > 0 && (
              <div className="text-left border-t pt-4">
                <p className="text-sm font-medium mb-2">Review these FAQs:</p>
                <div className="flex flex-wrap gap-1">
                  {reviewList.map(n => (
                    <Link key={n} to={`/faq/${n}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted">FAQ #{n}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" onClick={handleRestart} className="gap-1">
                <RotateCcw className="h-4 w-4" /> Try Again
              </Button>
              <Link to="/study"><Button>Back to Study Hub</Button></Link>
            </div>
          </Card>
        ) : currentQ ? (
          <>
            <div className="flex items-center gap-3">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground">{currentIndex + 1}/{total}</span>
              <div className="flex gap-2 text-xs">
                <span className="text-primary">{score.correct}✓</span>
                <span className="text-destructive">{score.incorrect}✗</span>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">FAQ #{currentQ.faqNumber}</Badge>
                  <Badge variant="secondary" className="text-xs">{currentQ.chapter}</Badge>
                </div>
                <CardTitle className="text-base leading-snug mt-2">{currentQ.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={answered}>
                  {currentQ.options.map((option, i) => {
                    let optionClass = '';
                    if (answered) {
                      if (option === currentQ.correctAnswer) optionClass = 'border-primary bg-primary/5';
                      else if (option === selectedAnswer) optionClass = 'border-destructive bg-destructive/5';
                    }
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${optionClass} ${
                        !answered ? 'hover:bg-muted cursor-pointer' : ''
                      }`}>
                        <RadioGroupItem value={option} id={`opt-${i}`} className="mt-0.5" />
                        <Label htmlFor={`opt-${i}`} className="text-sm leading-relaxed cursor-pointer flex-1">
                          {option}
                        </Label>
                        {answered && option === currentQ.correctAnswer && (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        )}
                        {answered && option === selectedAnswer && option !== currentQ.correctAnswer && (
                          <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>

                <div className="flex justify-end gap-2 pt-2">
                  {!answered ? (
                    <Button onClick={handleSubmit} disabled={!selectedAnswer}>Check Answer</Button>
                  ) : (
                    <Button onClick={handleNext}>
                      {currentIndex < total - 1 ? 'Next Question' : 'See Results'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
