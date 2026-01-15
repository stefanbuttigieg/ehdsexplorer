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
  Shuffle, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Trophy,
  GraduationCap
} from "lucide-react";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

interface FlashcardResult {
  term: string;
  knew: boolean;
}

const FlashcardGamePage = () => {
  const navigate = useNavigate();
  const { data: definitions, isLoading } = useDefinitions();
  const { checkAndUnlock } = useAchievements();
  
  const [cards, setCards] = useState<Array<{ id: number; term: string; definition: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [deckSize, setDeckSize] = useState<10 | 20 | "all">(10);

  const initializeGame = useCallback(() => {
    if (!definitions || definitions.length === 0) return;

    const shuffled = [...definitions].sort(() => Math.random() - 0.5);
    const selected = deckSize === "all" ? shuffled : shuffled.slice(0, deckSize);
    
    setCards(selected.map(d => ({
      id: d.id,
      term: d.term,
      definition: d.definition,
    })));
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults([]);
    setIsComplete(false);
  }, [definitions, deckSize]);

  useEffect(() => {
    if (definitions && definitions.length > 0) {
      initializeGame();
    }
  }, [definitions, deckSize, initializeGame]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResult = (knew: boolean) => {
    const currentCard = cards[currentIndex];
    setResults([...results, { term: currentCard.term, knew }]);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
      // Track flashcard session completion and definitions studied
      checkAndUnlock('flashcard_sessions', results.length + 1);
      checkAndUnlock('definitions_studied', cards.length);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      // Remove last result if going back
      setResults(results.slice(0, -1));
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setResults([]);
    setIsComplete(false);
  };

  const getStats = () => {
    const correct = results.filter(r => r.knew).length;
    const incorrect = results.filter(r => !r.knew).length;
    const percentage = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
    return { correct, incorrect, percentage };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading flashcards...</div>
        </div>
      </Layout>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + (isComplete ? 1 : 0)) / cards.length) * 100 : 0;
  const stats = getStats();

  return (
    <Layout>
      <Helmet>
        <title>Flashcard Game | EHDS Explorer</title>
        <meta name="description" content="Study EHDS definitions with interactive flashcards" />
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
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              {currentIndex + 1}/{cards.length}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            EHDS Flashcards
          </h1>
          <p className="text-muted-foreground text-sm">
            Flip cards to study definitions. Mark if you knew it!
          </p>
        </div>

        {/* Deck Size Selector */}
        {!isComplete && currentIndex === 0 && results.length === 0 && (
          <div className="flex justify-center gap-2 mb-6">
            {([10, 20, "all"] as const).map((size) => (
              <Button
                key={size}
                variant={deckSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => setDeckSize(size)}
              >
                {size === "all" ? "All" : size} cards
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
        {isComplete ? (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You studied all {cards.length} cards
            </p>
            
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-sm text-muted-foreground">Knew it</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{stats.incorrect}</div>
                <div className="text-sm text-muted-foreground">Learning</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.percentage}%</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
            </div>

            {/* Missed Terms Review */}
            {stats.incorrect > 0 && (
              <div className="mb-6 text-left">
                <h3 className="font-semibold mb-2 text-sm">Terms to review:</h3>
                <div className="flex flex-wrap gap-2">
                  {results.filter(r => !r.knew).map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {r.term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={initializeGame} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Study Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/match-game")} className="gap-2">
                Try Match Game
              </Button>
            </div>
          </Card>
        ) : currentCard ? (
          <>
            {/* Flashcard */}
            <div 
              className="perspective-1000 mb-6 cursor-pointer"
              onClick={handleFlip}
            >
              <div 
                className={cn(
                  "relative w-full aspect-[4/3] sm:aspect-[3/2] transition-transform duration-500",
                  "transform-style-3d",
                  isFlipped && "rotate-y-180"
                )}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front - Term */}
                <Card 
                  className={cn(
                    "absolute inset-0 p-6 sm:p-8 flex flex-col items-center justify-center",
                    "backface-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
                    isFlipped && "invisible"
                  )}
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <Badge className="mb-4">Term</Badge>
                  <h2 className="text-xl sm:text-2xl font-bold text-center">{currentCard.term}</h2>
                  <p className="text-sm text-muted-foreground mt-4">Click to reveal definition</p>
                </Card>

                {/* Back - Definition */}
                <Card 
                  className={cn(
                    "absolute inset-0 p-6 sm:p-8 flex flex-col items-center justify-center overflow-auto",
                    "backface-hidden bg-gradient-to-br from-secondary/50 to-secondary/30",
                    !isFlipped && "invisible"
                  )}
                  style={{ 
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <Badge variant="secondary" className="mb-4 shrink-0">Definition</Badge>
                  <p className="text-sm sm:text-base text-center leading-relaxed">{currentCard.definition}</p>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            {isFlipped ? (
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => handleResult(false)}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                  Learning
                </Button>
                <Button 
                  size="lg"
                  onClick={() => handleResult(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-5 w-5" />
                  Knew it!
                </Button>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button size="lg" onClick={handleFlip} className="gap-2">
                  Flip Card
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleShuffle}
                className="gap-1"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle
              </Button>
            </div>
          </>
        ) : null}

        {/* Reset Button */}
        {!isComplete && results.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={initializeGame} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FlashcardGamePage;
