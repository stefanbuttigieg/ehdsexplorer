import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  RotateCcw, 
  Trophy,
  Brain,
  Timer,
  Zap,
  CheckCircle,
  XCircle,
  Star
} from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: "article" | "definition";
  source: string;
}

interface QuizResult {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean;
  timeSpent: number;
}

const QUESTION_TIME_LIMIT = 20; // seconds per question

const QuizGamePage = () => {
  const navigate = useNavigate();
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: definitions, isLoading: definitionsLoading } = useDefinitions();
  const { checkAndUnlock } = useAchievements();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [quizSize, setQuizSize] = useState<10 | 15 | 20>(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const generateQuestions = useCallback((): Question[] => {
    const generatedQuestions: Question[] = [];
    
    // Generate article-based questions
    if (articles && articles.length > 0) {
      const shuffledArticles = [...articles].sort(() => Math.random() - 0.5);
      
      for (const article of shuffledArticles.slice(0, Math.ceil(quizSize / 2))) {
        // Question type: "Which article covers [topic]?"
        const correctAnswer = `Article ${article.article_number}`;
        const wrongAnswers = shuffledArticles
          .filter(a => a.id !== article.id)
          .slice(0, 3)
          .map(a => `Article ${a.article_number}`);
        
        if (wrongAnswers.length === 3) {
          const options = [...wrongAnswers, correctAnswer].sort(() => Math.random() - 0.5);
          generatedQuestions.push({
            id: `article-${article.id}`,
            question: `Which article covers "${article.title}"?`,
            options,
            correctIndex: options.indexOf(correctAnswer),
            category: "article",
            source: `Article ${article.article_number}`,
          });
        }
      }
    }

    // Generate definition-based questions
    if (definitions && definitions.length > 0) {
      const shuffledDefs = [...definitions].sort(() => Math.random() - 0.5);
      
      for (const def of shuffledDefs.slice(0, Math.ceil(quizSize / 2))) {
        // Question type: "What is the definition of [term]?"
        const correctAnswer = def.definition.length > 100 
          ? def.definition.substring(0, 100) + "..." 
          : def.definition;
        
        const wrongAnswers = shuffledDefs
          .filter(d => d.id !== def.id)
          .slice(0, 3)
          .map(d => d.definition.length > 100 ? d.definition.substring(0, 100) + "..." : d.definition);
        
        if (wrongAnswers.length === 3) {
          const options = [...wrongAnswers, correctAnswer].sort(() => Math.random() - 0.5);
          generatedQuestions.push({
            id: `def-${def.id}`,
            question: `What is the correct definition of "${def.term}"?`,
            options,
            correctIndex: options.indexOf(correctAnswer),
            category: "definition",
            source: def.term,
          });
        }
      }
    }

    return generatedQuestions.sort(() => Math.random() - 0.5).slice(0, quizSize);
  }, [articles, definitions, quizSize]);

  const startGame = () => {
    const newQuestions = generateQuestions();
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setResults([]);
    setIsComplete(false);
    setGameStarted(true);
    setTimeRemaining(QUESTION_TIME_LIMIT);
    setTotalTime(0);
    startTimeRef.current = Date.now();
  };

  // Timer effect
  useEffect(() => {
    if (gameStarted && !isComplete && !showAnswer) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto submit with no answer
            handleTimeUp();
            return QUESTION_TIME_LIMIT;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, isComplete, showAnswer, currentIndex]);

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const timeSpent = QUESTION_TIME_LIMIT;
    const currentQuestion = questions[currentIndex];
    
    setResults(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedIndex: null,
      isCorrect: false,
      timeSpent,
    }]);
    
    setShowAnswer(true);
  };

  const handleOptionSelect = (index: number) => {
    if (showAnswer) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || showAnswer) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const timeSpent = QUESTION_TIME_LIMIT - timeRemaining;
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correctIndex;
    
    setResults(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedIndex: selectedOption,
      isCorrect,
      timeSpent,
    }]);
    
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
      setTimeRemaining(QUESTION_TIME_LIMIT);
    } else {
      setIsComplete(true);
      setTotalTime(Math.round((Date.now() - startTimeRef.current) / 1000));
      // Track quiz completion
      checkAndUnlock('quiz_completed', results.length + 1);
    }
  };

  const getStats = () => {
    const correct = results.filter(r => r.isCorrect).length;
    const incorrect = results.filter(r => !r.isCorrect).length;
    const percentage = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
    const avgTime = results.length > 0 
      ? Math.round(results.reduce((acc, r) => acc + r.timeSpent, 0) / results.length) 
      : 0;
    return { correct, incorrect, percentage, avgTime };
  };

  const getScoreRating = (percentage: number) => {
    if (percentage >= 90) return { label: "EHDS Expert!", stars: 3, color: "text-yellow-500" };
    if (percentage >= 70) return { label: "Great Job!", stars: 2, color: "text-primary" };
    if (percentage >= 50) return { label: "Good Effort!", stars: 1, color: "text-muted-foreground" };
    return { label: "Keep Learning!", stars: 0, color: "text-muted-foreground" };
  };

  const isLoading = articlesLoading || definitionsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading quiz...</div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + (showAnswer ? 1 : 0)) / questions.length) * 100 : 0;
  const stats = getStats();

  return (
    <Layout>
      <Helmet>
        <title>Quiz Challenge | EHDS Explorer</title>
        <meta name="description" content="Test your knowledge of EHDS with timed multiple-choice questions" />
      </Helmet>

      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {gameStarted && !isComplete && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                {currentIndex + 1}/{questions.length}
              </Badge>
              <Badge 
                variant={timeRemaining <= 5 ? "destructive" : "secondary"} 
                className={cn("gap-1.5 px-3 py-1.5", timeRemaining <= 5 && "animate-pulse")}
              >
                <Timer className="h-3 w-3" />
                {timeRemaining}s
              </Badge>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Quiz Challenge
          </h1>
          <p className="text-muted-foreground text-sm">
            Test your EHDS knowledge with timed questions!
          </p>
        </div>

        {/* Start Screen */}
        {!gameStarted && !isComplete && (
          <Card className="p-8 text-center">
            <Zap className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Ready to Test Your Knowledge?</h2>
            <p className="text-muted-foreground mb-6">
              Answer multiple-choice questions about EHDS articles and definitions. 
              You have {QUESTION_TIME_LIMIT} seconds per question!
            </p>
            
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Select number of questions:</p>
              <div className="flex justify-center gap-2">
                {([10, 15, 20] as const).map((size) => (
                  <Button
                    key={size}
                    variant={quizSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuizSize(size)}
                  >
                    {size} questions
                  </Button>
                ))}
              </div>
            </div>

            <Button size="lg" onClick={startGame} className="gap-2">
              <Zap className="h-5 w-5" />
              Start Quiz
            </Button>
          </Card>
        )}

        {/* Game Complete Screen */}
        {isComplete && (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
            
            {/* Star Rating */}
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(3)].map((_, i) => (
                <Star 
                  key={i} 
                  className={cn(
                    "h-8 w-8",
                    i < getScoreRating(stats.percentage).stars 
                      ? "text-yellow-500 fill-yellow-500" 
                      : "text-muted-foreground/30"
                  )} 
                />
              ))}
            </div>
            
            <p className={cn("text-lg font-semibold mb-6", getScoreRating(stats.percentage).color)}>
              {getScoreRating(stats.percentage).label}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-red-500">{stats.incorrect}</div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.percentage}%</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold">{totalTime}s</div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button onClick={startGame} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Play Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/flashcards")} className="gap-2">
                Try Flashcards
              </Button>
              <Button variant="outline" onClick={() => navigate("/match-game")} className="gap-2">
                Try Match Game
              </Button>
            </div>
          </Card>
        )}

        {/* Question Card */}
        {gameStarted && !isComplete && currentQuestion && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{stats.correct} correct</span>
                <span>{stats.incorrect} incorrect</span>
              </div>
            </div>

            {/* Timer Progress */}
            <div className="mb-4">
              <Progress 
                value={(timeRemaining / QUESTION_TIME_LIMIT) * 100} 
                className={cn("h-1", timeRemaining <= 5 && "bg-red-200 [&>div]:bg-red-500")}
              />
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                {/* Question Category Badge */}
                <Badge variant="secondary" className="mb-4">
                  {currentQuestion.category === "article" ? "Article" : "Definition"}
                </Badge>
                
                {/* Question */}
                <h2 className="text-lg font-semibold mb-6">{currentQuestion.question}</h2>
                
                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = index === currentQuestion.correctIndex;
                    const showCorrect = showAnswer && isCorrect;
                    const showIncorrect = showAnswer && isSelected && !isCorrect;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={showAnswer}
                        className={cn(
                          "w-full p-4 text-left rounded-lg border-2 transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected && !showAnswer && "border-primary bg-primary/10",
                          showCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
                          showIncorrect && "border-red-500 bg-red-50 dark:bg-red-950/30",
                          !isSelected && !showCorrect && !showIncorrect && "border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                            isSelected && !showAnswer && "bg-primary text-primary-foreground",
                            showCorrect && "bg-green-500 text-white",
                            showIncorrect && "bg-red-500 text-white",
                            !isSelected && !showCorrect && !showIncorrect && "bg-muted"
                          )}>
                            {showCorrect ? <CheckCircle className="h-4 w-4" /> : 
                             showIncorrect ? <XCircle className="h-4 w-4" /> : 
                             String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-sm leading-relaxed">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex justify-center">
              {!showAnswer ? (
                <Button 
                  size="lg" 
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="gap-2"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleNextQuestion}
                  className="gap-2"
                >
                  {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default QuizGamePage;
