import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Trophy, Sparkles, Timer, CheckCircle2 } from "lucide-react";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

interface GameCard {
  id: string;
  content: string;
  type: "term" | "definition";
  matchId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

const MatchGamePage = () => {
  const navigate = useNavigate();
  const { data: definitions, isLoading } = useDefinitions();
  const { checkAndUnlock } = useAchievements();
  
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState<4 | 6 | 8>(4);

  const initializeGame = useCallback(() => {
    if (!definitions || definitions.length === 0) return;

    // Shuffle and pick definitions based on difficulty
    const shuffled = [...definitions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, difficulty);

    const gameCards: GameCard[] = [];
    
    selected.forEach((def, index) => {
      // Term card
      gameCards.push({
        id: `term-${def.id}`,
        content: def.term,
        type: "term",
        matchId: index,
        isFlipped: false,
        isMatched: false,
      });
      
      // Definition card (truncated for display)
      const truncatedDef = def.definition.length > 80 
        ? def.definition.substring(0, 80) + "..." 
        : def.definition;
      
      gameCards.push({
        id: `def-${def.id}`,
        content: truncatedDef,
        type: "definition",
        matchId: index,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle all cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
    setSelectedCards([]);
    setMatches(0);
    setAttempts(0);
    setGameComplete(false);
    setTimer(0);
    setIsPlaying(true);
  }, [definitions, difficulty]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameComplete) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameComplete]);

  // Initialize game when definitions load
  useEffect(() => {
    if (definitions && definitions.length > 0) {
      initializeGame();
    }
  }, [definitions, difficulty, initializeGame]);

  const handleCardClick = (clickedCard: GameCard) => {
    // Ignore if already matched, already selected, or two cards are being compared
    if (
      clickedCard.isMatched ||
      clickedCard.isFlipped ||
      selectedCards.length >= 2
    ) {
      return;
    }

    // Flip the card
    const updatedCards = cards.map((card) =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );
    setCards(updatedCards);

    const newSelected = [...selectedCards, { ...clickedCard, isFlipped: true }];
    setSelectedCards(newSelected);

    // Check for match when two cards are selected
    if (newSelected.length === 2) {
      setAttempts((prev) => prev + 1);
      
      const [first, second] = newSelected;
      
      if (first.matchId === second.matchId && first.type !== second.type) {
        // Match found!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.matchId === first.matchId
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatches((prev) => {
            const newMatches = prev + 1;
            if (newMatches === difficulty) {
              setGameComplete(true);
              setIsPlaying(false);
              
              // Check for game achievements
              checkAndUnlock('match_games', 1);
              
              // Check for speed achievement (under 60 seconds)
              if (timer < 60) {
                checkAndUnlock('match_speed', 60);
              }
              
              // Check for perfect game (no wrong attempts)
              if (attempts === difficulty) {
                checkAndUnlock('match_perfect', 1);
              }
              
              // Track definitions studied
              checkAndUnlock('definitions_studied', difficulty);
            }
            return newMatches;
          });
          setSelectedCards([]);
        }, 500);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first.id || card.id === second.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAccuracy = () => {
    if (attempts === 0) return 0;
    return Math.round((matches / attempts) * 100);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading game...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <Timer className="h-3.5 w-3.5" />
              {formatTime(timer)}
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {matches}/{difficulty}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            EHDS Match Game
          </h1>
          <p className="text-muted-foreground">
            Match EHDS terms with their definitions
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {([4, 6, 8] as const).map((level) => (
            <Button
              key={level}
              variant={difficulty === level ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(level)}
              disabled={isPlaying && !gameComplete}
            >
              {level} Pairs
            </Button>
          ))}
        </div>

        {/* Game Complete Screen */}
        {gameComplete && (
          <Card className="p-8 mb-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
            <p className="text-muted-foreground mb-4">
              You matched all {difficulty} pairs!
            </p>
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div>
                <div className="font-semibold text-lg">{formatTime(timer)}</div>
                <div className="text-muted-foreground">Time</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{attempts}</div>
                <div className="text-muted-foreground">Attempts</div>
              </div>
              <div>
                <div className="font-semibold text-lg">{getAccuracy()}%</div>
                <div className="text-muted-foreground">Accuracy</div>
              </div>
            </div>
            <Button onClick={initializeGame} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
          </Card>
        )}

        {/* Game Grid */}
        <div
          className={cn(
            "grid gap-3",
            difficulty === 4 && "grid-cols-2 sm:grid-cols-4",
            difficulty === 6 && "grid-cols-3 sm:grid-cols-4",
            difficulty === 8 && "grid-cols-4"
          )}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={card.isMatched || gameComplete}
              className={cn(
                "relative aspect-[3/4] rounded-xl transition-all duration-300 transform-gpu",
                "border-2 p-3 text-left",
                "hover:scale-[1.02] active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                card.isMatched && "opacity-50 cursor-default",
                card.isFlipped && !card.isMatched && "ring-2 ring-primary",
                !card.isFlipped && !card.isMatched && "bg-muted/50 hover:bg-muted border-border",
                card.isFlipped && card.type === "term" && "bg-primary/10 border-primary/30",
                card.isFlipped && card.type === "definition" && "bg-secondary/50 border-secondary"
              )}
            >
              {card.isFlipped || card.isMatched ? (
                <div className="h-full flex flex-col">
                  <Badge
                    variant={card.type === "term" ? "default" : "secondary"}
                    className="w-fit text-xs mb-2"
                  >
                    {card.type === "term" ? "Term" : "Definition"}
                  </Badge>
                  <p
                    className={cn(
                      "text-sm leading-snug flex-1",
                      card.type === "term" && "font-semibold"
                    )}
                  >
                    {card.content}
                  </p>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={initializeGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            New Game
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default MatchGamePage;
