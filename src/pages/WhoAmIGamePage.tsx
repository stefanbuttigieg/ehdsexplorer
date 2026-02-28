import { useState, useCallback, useEffect } from "react";
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
  HelpCircle,
  CheckCircle,
  XCircle,
  Eye,
  UserSearch,
  Lightbulb,
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

interface Entity {
  id: string;
  name: string;
  clues: string[];
  category: string;
  articleRef?: string;
}

const ENTITIES: Entity[] = [
  {
    id: "dha",
    name: "Digital Health Authority (DHA)",
    category: "National Body",
    articleRef: "Article 10",
    clues: [
      "I am designated by each EU Member State.",
      "I oversee the primary use of electronic health data.",
      "I supervise EHR systems and their compliance with the regulation.",
      "I handle complaints from natural persons about their health data rights.",
      "I am the Digital Health Authority.",
    ],
  },
  {
    id: "hdab",
    name: "Health Data Access Body (HDAB)",
    category: "National Body",
    articleRef: "Article 36",
    clues: [
      "I process applications for secondary use of health data.",
      "Each Member State must designate at least one of me.",
      "I issue data permits to approved data users.",
      "I ensure data is accessed in a secure processing environment.",
      "I am the Health Data Access Body.",
    ],
  },
  {
    id: "ehds-board",
    name: "EHDS Board",
    category: "EU Body",
    articleRef: "Article 64",
    clues: [
      "I consist of representatives from all Member States.",
      "I facilitate cooperation between national authorities.",
      "The European Commission participates in my meetings.",
      "I advise on cross-border health data exchange matters.",
      "I am the EHDS Board.",
    ],
  },
  {
    id: "data-holder",
    name: "Data Holder",
    category: "Actor",
    articleRef: "Article 2(8)",
    clues: [
      "I can be a natural or legal person, or a public authority.",
      "I have a right or obligation to make electronic health data available.",
      "I must respond to data access requests within specified timeframes.",
      "I provide data for both primary and secondary use purposes.",
      "I am the Data Holder.",
    ],
  },
  {
    id: "data-user",
    name: "Data User",
    category: "Actor",
    articleRef: "Article 2(10)",
    clues: [
      "I access health data for secondary use purposes.",
      "I must apply for a data permit from the relevant authority.",
      "I can use data for research, innovation, or policy-making.",
      "I must process data in a secure processing environment.",
      "I am the Data User.",
    ],
  },
  {
    id: "myhealth-eu",
    name: "MyHealth@EU",
    category: "Infrastructure",
    articleRef: "Article 12",
    clues: [
      "I am a cross-border digital infrastructure.",
      "I enable EU citizens to access their health data abroad.",
      "I connect national contact points across Member States.",
      "I facilitate primary use of electronic health data across borders.",
      "I am MyHealth@EU.",
    ],
  },
  {
    id: "healthdata-eu",
    name: "HealthData@EU",
    category: "Infrastructure",
    articleRef: "Article 52",
    clues: [
      "I am a cross-border infrastructure for secondary use of health data.",
      "I connect national Health Data Access Bodies.",
      "I enable multi-country health data research.",
      "I provide a secure environment for accessing data from multiple Member States.",
      "I am HealthData@EU.",
    ],
  },
  {
    id: "ehr-manufacturer",
    name: "EHR System Manufacturer",
    category: "Actor",
    articleRef: "Article 17",
    clues: [
      "I design and develop electronic health record systems.",
      "I must ensure my products meet essential requirements before placing them on the market.",
      "I draw up an EU declaration of conformity for my products.",
      "I must affix a CE marking to compliant products.",
      "I am the EHR System Manufacturer.",
    ],
  },
  {
    id: "natural-person",
    name: "Natural Person (Patient/Citizen)",
    category: "Rights Holder",
    articleRef: "Article 3",
    clues: [
      "I have the right to access my electronic health data free of charge.",
      "I can restrict access to parts of my health data.",
      "I can designate a proxy to access my health data on my behalf.",
      "I benefit from the portability of my health data across borders.",
      "I am the Natural Person — the patient or citizen at the heart of EHDS.",
    ],
  },
  {
    id: "european-commission",
    name: "European Commission",
    category: "EU Body",
    articleRef: "Multiple articles",
    clues: [
      "I adopt delegated and implementing acts under this regulation.",
      "I establish the European Health Data Space exchange format.",
      "I provide financial support for EHDS infrastructure.",
      "I participate in the EHDS Board and coordinate cross-border initiatives.",
      "I am the European Commission.",
    ],
  },
  {
    id: "market-surveillance",
    name: "Market Surveillance Authority",
    category: "National Body",
    articleRef: "Article 28",
    clues: [
      "I monitor EHR systems already on the market.",
      "I can investigate non-compliant products and take corrective measures.",
      "I coordinate with other national authorities across the EU.",
      "I ensure EHR systems continue to meet essential requirements post-sale.",
      "I am the Market Surveillance Authority.",
    ],
  },
  {
    id: "notified-body",
    name: "Notified Body",
    category: "Actor",
    articleRef: "Article 26",
    clues: [
      "I am designated by a Member State to carry out conformity assessments.",
      "I evaluate high-risk EHR systems before they can enter the EU market.",
      "I must demonstrate competence and independence in my assessments.",
      "I issue certificates of conformity for EHR systems.",
      "I am the Notified Body.",
    ],
  },
];

interface GameAnswer {
  entityId: string;
  cluesUsed: number;
  correct: boolean;
}

const WhoAmIGamePage = () => {
  const navigate = useNavigate();
  const { checkAndUnlock } = useAchievements();

  const [entities, setEntities] = useState<Entity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedClues, setRevealedClues] = useState(1);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [roundCount, setRoundCount] = useState<8 | 10 | 12>(8);

  const shuffleAndPick = useCallback(() => {
    const shuffled = [...ENTITIES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(roundCount, shuffled.length));
  }, [roundCount]);

  const initializeGame = useCallback(() => {
    setEntities(shuffleAndPick());
    setCurrentIndex(0);
    setRevealedClues(1);
    setAnswers([]);
    setGameComplete(false);
    setShowOptions(false);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [shuffleAndPick]);

  useEffect(() => {
    initializeGame();
  }, [roundCount]);

  const currentEntity = entities[currentIndex];

  const generateOptions = useCallback(() => {
    if (!currentEntity) return [];
    const others = ENTITIES.filter((e) => e.id !== currentEntity.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [...others, currentEntity].sort(() => Math.random() - 0.5);
  }, [currentEntity]);

  const [options, setOptions] = useState<Entity[]>([]);

  useEffect(() => {
    if (showOptions && currentEntity) {
      setOptions(generateOptions());
    }
  }, [showOptions, currentEntity]);

  const handleRevealClue = () => {
    if (currentEntity && revealedClues < currentEntity.clues.length) {
      setRevealedClues((prev) => prev + 1);
    }
  };

  const handleGuess = () => {
    setShowOptions(true);
  };

  const handleSelectAnswer = (entityId: string) => {
    if (showResult) return;
    setSelectedAnswer(entityId);
    setShowResult(true);

    const correct = entityId === currentEntity?.id;
    const answer: GameAnswer = {
      entityId: currentEntity!.id,
      cluesUsed: revealedClues,
      correct,
    };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIndex < entities.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setRevealedClues(1);
        setShowOptions(false);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameComplete(true);
        checkAndUnlock("whoami_games", 1);
        const correctCount = newAnswers.filter((a) => a.correct).length;
        if (correctCount === entities.length) {
          checkAndUnlock("whoami_perfect", 1);
        }
      }
    }, 2000);
  };

  const getScore = () => {
    let score = 0;
    answers.forEach((a) => {
      if (a.correct) {
        // More points for fewer clues used (max 5 per correct answer with 1 clue)
        score += Math.max(1, 6 - a.cluesUsed);
      }
    });
    return score;
  };

  const maxPossibleScore = entities.length * 5; // All correct with 1 clue each
  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
  const avgClues =
    answers.length > 0
      ? Math.round((answers.reduce((s, a) => s + a.cluesUsed, 0) / answers.length) * 10) / 10
      : 0;
  const progress =
    entities.length > 0
      ? ((currentIndex + (gameComplete ? 1 : 0)) / entities.length) * 100
      : 0;

  if (entities.length === 0) {
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
      <Helmet>
        <title>Who Am I? | EHDS Explorer</title>
        <meta
          name="description"
          content="Guess the EHDS stakeholder or entity from progressive clues about their role and obligations"
        />
      </Helmet>

      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/games")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Games
          </Button>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            {currentIndex + 1}/{entities.length}
          </Badge>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <UserSearch className="h-6 w-6 text-primary" />
            Who Am I?
          </h1>
          <p className="text-muted-foreground text-sm">
            Guess the EHDS entity from progressive clues. Fewer clues = more points!
          </p>
        </div>

        {/* Round Selector */}
        {currentIndex === 0 && !showOptions && revealedClues === 1 && answers.length === 0 && (
          <div className="flex justify-center gap-2 mb-6">
            {([8, 10, 12] as const).map((count) => (
              <Button
                key={count}
                variant={roundCount === count ? "default" : "outline"}
                size="sm"
                onClick={() => setRoundCount(count)}
              >
                {count} Rounds
              </Button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{correctCount} correct</span>
            <span>Score: {getScore()}</span>
          </div>
        </div>

        {/* Game Complete */}
        {gameComplete ? (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Game Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You identified {correctCount} out of {entities.length} entities
            </p>

            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{getScore()}</div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{avgClues}</div>
                <div className="text-sm text-muted-foreground">Avg Clues</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="text-left mb-6 space-y-2">
              {answers.map((a, i) => {
                const entity = ENTITIES.find((e) => e.id === a.entityId);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm p-2 rounded",
                      a.correct ? "bg-accent/10" : "bg-destructive/10"
                    )}
                  >
                    {a.correct ? (
                      <CheckCircle className="h-4 w-4 text-accent-foreground shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="font-medium">{entity?.name}</span>
                    <span className="text-muted-foreground ml-auto">
                      {a.cluesUsed} clue{a.cluesUsed > 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
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
        ) : currentEntity ? (
          <>
            {/* Clue Card */}
            <Card className="p-6 sm:p-8 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Clue {revealedClues} of {currentEntity.clues.length}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {currentEntity.category}
                </Badge>
              </div>

              <div className="space-y-3">
                {currentEntity.clues.slice(0, revealedClues).map((clue, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-all",
                      idx === revealedClues - 1
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50"
                    )}
                  >
                    <Lightbulb
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        idx === revealedClues - 1 ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <p
                      className={cn(
                        "text-sm",
                        idx === revealedClues - 1 ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {clue}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            {!showOptions ? (
              <div className="flex justify-center gap-3">
                {revealedClues < currentEntity.clues.length && (
                  <Button variant="outline" onClick={handleRevealClue} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Next Clue
                  </Button>
                )}
                <Button onClick={handleGuess} className="gap-2">
                  <UserSearch className="h-4 w-4" />
                  I Know!
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Who am I?
                </p>
                {options.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left h-auto py-3 px-4",
                      showResult &&
                        option.id === currentEntity.id &&
                        "border-accent bg-accent/10",
                      showResult &&
                        selectedAnswer === option.id &&
                        option.id !== currentEntity.id &&
                        "border-destructive bg-destructive/10"
                    )}
                    onClick={() => handleSelectAnswer(option.id)}
                    disabled={showResult}
                  >
                    <div>
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs text-muted-foreground">{option.category}</div>
                    </div>
                    {showResult && option.id === currentEntity.id && (
                      <CheckCircle className="h-4 w-4 text-accent-foreground ml-auto shrink-0" />
                    )}
                    {showResult &&
                      selectedAnswer === option.id &&
                      option.id !== currentEntity.id && (
                        <XCircle className="h-4 w-4 text-destructive ml-auto shrink-0" />
                      )}
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : null}

        {/* Restart */}
        {!gameComplete && currentIndex > 0 && !showResult && (
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

export default WhoAmIGamePage;
