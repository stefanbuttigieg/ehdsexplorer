import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  RotateCcw, 
  Trophy,
  Timer,
  CheckCircle,
  XCircle,
  Zap,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useArticles } from "@/hooks/useArticles";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

interface Statement {
  id: number;
  text: string;
  isTrue: boolean;
  explanation: string;
}

interface Answer {
  statementId: number;
  userAnswer: boolean;
  correct: boolean;
  timeTaken: number;
}

const TIME_LIMIT = 10; // seconds per statement

const TrueFalseGamePage = () => {
  const navigate = useNavigate();
  const { data: definitions = [], isLoading: defsLoading } = useDefinitions();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { checkAndUnlock } = useAchievements();
  
  const [statements, setStatements] = useState<Statement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [gameComplete, setGameComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [difficulty, setDifficulty] = useState<10 | 15 | 20>(10);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // Generate statements from definitions and articles
  const generateStatements = useCallback((): Statement[] => {
    const generated: Statement[] = [];
    let id = 0;

    // Create true statements from definitions
    definitions.slice(0, Math.ceil(difficulty / 2)).forEach((def) => {
      generated.push({
        id: id++,
        text: `"${def.term}" is defined in the EHDS regulation.`,
        isTrue: true,
        explanation: `Correct! ${def.term} is defined as: "${def.definition.slice(0, 100)}..."`,
      });
    });

    // Create false statements by mixing up definitions
    const shuffledDefs = [...definitions].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(difficulty / 4, shuffledDefs.length - 1); i++) {
      const def1 = shuffledDefs[i];
      const def2 = shuffledDefs[i + 1];
      if (def1 && def2) {
        generated.push({
          id: id++,
          text: `"${def1.term}" means "${def2.definition.slice(0, 80)}..."`,
          isTrue: false,
          explanation: `False! "${def1.term}" actually refers to something different. The definition shown belongs to "${def2.term}".`,
        });
      }
    }

    // Add some article-based true/false statements
    const keyArticles = articles.filter(a => a.is_key_provision).slice(0, 5);
    keyArticles.forEach((article) => {
      generated.push({
        id: id++,
        text: `Article ${article.article_number} ("${article.title}") is a key provision of the EHDS.`,
        isTrue: true,
        explanation: `Correct! Article ${article.article_number} is indeed a key provision covering ${article.title}.`,
      });
    });

    // False statements about article numbers
    const nonKeyArticles = articles.filter(a => !a.is_key_provision).slice(0, 3);
    nonKeyArticles.forEach((article) => {
      generated.push({
        id: id++,
        text: `Article ${article.article_number} is a key provision of the EHDS.`,
        isTrue: false,
        explanation: `False! While Article ${article.article_number} ("${article.title}") is part of the EHDS, it's not marked as a key provision.`,
      });
    });

    // Add EHDS-specific true statements
    const ehdsFactsTrue = [
      { text: "The EHDS establishes a European Health Data Space.", explanation: "Correct! The EHDS creates a unified space for health data across the EU." },
      { text: "Primary use refers to processing health data for healthcare provision.", explanation: "Correct! Primary use is for direct patient care." },
      { text: "Secondary use allows health data to be used for research purposes.", explanation: "Correct! Secondary use covers research, policy-making, and innovation." },
      { text: "The EHDS requires EHR systems to be interoperable.", explanation: "Correct! Interoperability is a core requirement for EHR systems." },
      { text: "Natural persons have the right to access their electronic health data.", explanation: "Correct! Patient access rights are fundamental to the EHDS." },
    ];

    // Add EHDS-specific false statements
    const ehdsFactsFalse = [
      { text: "The EHDS only applies to public healthcare providers.", explanation: "False! The EHDS applies to both public and private healthcare providers." },
      { text: "Health data can be sold directly to commercial entities under EHDS.", explanation: "False! The EHDS has strict controls on how health data can be used." },
      { text: "Member States can opt out of the EHDS entirely.", explanation: "False! As an EU regulation, EHDS applies to all Member States." },
      { text: "The EHDS replaces the GDPR for health data.", explanation: "False! The EHDS complements and works alongside the GDPR." },
    ];

    ehdsFactsTrue.forEach((fact) => {
      generated.push({ id: id++, text: fact.text, isTrue: true, explanation: fact.explanation });
    });

    ehdsFactsFalse.forEach((fact) => {
      generated.push({ id: id++, text: fact.text, isTrue: false, explanation: fact.explanation });
    });

    // Shuffle and limit to difficulty level
    return generated.sort(() => Math.random() - 0.5).slice(0, difficulty);
  }, [definitions, articles, difficulty]);

  // Initialize game
  const initializeGame = useCallback(() => {
    const generated = generateStatements();
    setStatements(generated);
    setCurrentIndex(0);
    setAnswers([]);
    setTimeLeft(TIME_LIMIT);
    setGameComplete(false);
    setIsPlaying(true);
    setShowResult(false);
    setLastAnswer(null);
    setStreak(0);
    setMaxStreak(0);
  }, [generateStatements]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !showResult && !gameComplete && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - count as wrong
            handleAnswer(null);
            return TIME_LIMIT;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, showResult, gameComplete, timeLeft]);

  // Initialize when data loads
  useEffect(() => {
    if (definitions.length > 0 && articles.length > 0) {
      initializeGame();
    }
  }, [definitions.length, articles.length, difficulty]);

  const handleAnswer = (userAnswer: boolean | null) => {
    const currentStatement = statements[currentIndex];
    if (!currentStatement) return;

    const timeTaken = TIME_LIMIT - timeLeft;
    const correct = userAnswer === currentStatement.isTrue;

    const answer: Answer = {
      statementId: currentStatement.id,
      userAnswer: userAnswer ?? !currentStatement.isTrue, // If null (timeout), mark as wrong
      correct: userAnswer !== null && correct,
      timeTaken,
    };

    setAnswers([...answers, answer]);
    setLastAnswer({ correct: answer.correct, explanation: currentStatement.explanation });
    setShowResult(true);

    // Update streak
    if (answer.correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }
    } else {
      setStreak(0);
    }

    // Move to next after showing result
    setTimeout(() => {
      setShowResult(false);
      setLastAnswer(null);
      
      if (currentIndex < statements.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTimeLeft(TIME_LIMIT);
      } else {
        setGameComplete(true);
        setIsPlaying(false);
        
        // Track achievements
        checkAndUnlock('truefalse_games', 1);
        
        const correctCount = [...answers, answer].filter(a => a.correct).length;
        const accuracy = (correctCount / statements.length) * 100;
        
        if (accuracy >= 80) {
          checkAndUnlock('truefalse_accuracy', 80);
        }
        
        if (maxStreak >= 5) {
          checkAndUnlock('truefalse_streak', 5);
        }
      }
    }, 1500);
  };

  const getStats = () => {
    const correct = answers.filter(a => a.correct).length;
    const accuracy = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0;
    const avgTime = answers.length > 0 
      ? Math.round(answers.reduce((sum, a) => sum + a.timeTaken, 0) / answers.length * 10) / 10
      : 0;
    return { correct, incorrect: answers.length - correct, accuracy, avgTime };
  };

  if (defsLoading || articlesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading game...</div>
        </div>
      </Layout>
    );
  }

  const currentStatement = statements[currentIndex];
  const progress = statements.length > 0 ? ((currentIndex + (gameComplete ? 1 : 0)) / statements.length) * 100 : 0;
  const stats = getStats();

  return (
    <Layout>
      <Helmet>
        <title>True or False | EHDS Explorer</title>
        <meta name="description" content="Test your EHDS knowledge with quick true or false questions" />
      </Helmet>

      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/games")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Games
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Zap className="h-3.5 w-3.5" />
              {streak} streak
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              {currentIndex + 1}/{statements.length}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            True or False
          </h1>
          <p className="text-muted-foreground text-sm">
            Quick-fire EHDS knowledge test. You have {TIME_LIMIT} seconds per question!
          </p>
        </div>

        {/* Difficulty Selector */}
        {!isPlaying && !gameComplete && (
          <div className="flex justify-center gap-2 mb-6">
            {([10, 15, 20] as const).map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(level)}
              >
                {level} Questions
              </Button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.correct} correct</span>
            <span>{stats.incorrect} incorrect</span>
          </div>
        </div>

        {/* Game Complete Screen */}
        {gameComplete ? (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Game Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You answered {statements.length} questions
            </p>
            
            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-muted-foreground">{stats.incorrect}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{maxStreak}</div>
                <div className="text-sm text-muted-foreground">Max Streak</div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button onClick={initializeGame} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Play Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/games")} className="gap-2">
                All Games
              </Button>
            </div>
          </Card>
        ) : currentStatement ? (
          <>
            {/* Timer */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className={cn(
                  "h-5 w-5",
                  timeLeft <= 3 ? "text-destructive animate-pulse" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-2xl font-bold",
                  timeLeft <= 3 ? "text-destructive" : "text-foreground"
                )}>
                  {timeLeft}
                </span>
              </div>
              <Progress 
                value={(timeLeft / TIME_LIMIT) * 100} 
                className={cn("h-2", timeLeft <= 3 && "[&>div]:bg-destructive")}
              />
            </div>

            {/* Statement Card */}
            <Card className={cn(
              "p-6 sm:p-8 mb-6 transition-all",
              showResult && lastAnswer?.correct && "border-accent bg-accent/10",
              showResult && !lastAnswer?.correct && "border-destructive bg-destructive/10"
            )}>
              <p className="text-lg sm:text-xl text-center leading-relaxed">
                {currentStatement.text}
              </p>
              
              {showResult && lastAnswer && (
                <div className={cn(
                  "mt-6 p-4 rounded-lg text-sm",
                  lastAnswer.correct ? "bg-accent/20" : "bg-destructive/20"
                )}>
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    {lastAnswer.correct ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-accent-foreground" />
                        <span className="text-accent-foreground">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-destructive" />
                        <span className="text-destructive">Incorrect</span>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground">{lastAnswer.explanation}</p>
                </div>
              )}
            </Card>

            {/* Answer Buttons */}
            {!showResult && (
              <div className="flex justify-center gap-4">
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                  className="gap-2 min-w-[140px] border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                >
                  <ThumbsDown className="h-5 w-5" />
                  False
                </Button>
                <Button 
                  size="lg"
                  onClick={() => handleAnswer(true)}
                  className="gap-2 min-w-[140px]"
                >
                  <ThumbsUp className="h-5 w-5" />
                  True
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <Button onClick={initializeGame} size="lg" className="gap-2">
              <Zap className="h-5 w-5" />
              Start Game
            </Button>
          </div>
        )}

        {/* Reset Button */}
        {isPlaying && !showResult && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={initializeGame} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Restart
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrueFalseGamePage;
