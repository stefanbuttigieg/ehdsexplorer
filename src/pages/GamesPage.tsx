import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gamepad2, 
  GraduationCap, 
  Brain, 
  Grid3X3, 
  Zap,
  Trophy,
  Timer,
  Target
} from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";

interface GameInfo {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  skills: string[];
}

const games: GameInfo[] = [
  {
    title: "Flashcards",
    description: "Study EHDS definitions with interactive flashcards. Flip to reveal definitions and track which terms you know.",
    path: "/flashcards",
    icon: GraduationCap,
    difficulty: "Easy",
    duration: "5-10 min",
    skills: ["Memory", "Definitions"],
  },
  {
    title: "Match Game",
    description: "Match EHDS terms with their definitions in this memory-style game. Race against the clock!",
    path: "/match-game",
    icon: Gamepad2,
    difficulty: "Medium",
    duration: "3-5 min",
    skills: ["Memory", "Speed"],
  },
  {
    title: "Quiz Challenge",
    description: "Test your EHDS knowledge with multiple-choice questions covering articles, definitions, and key concepts.",
    path: "/quiz",
    icon: Brain,
    difficulty: "Hard",
    duration: "5-15 min",
    skills: ["Knowledge", "Comprehension"],
  },
  {
    title: "Word Search",
    description: "Find hidden EHDS terms in a grid of letters. Great for familiarizing yourself with key terminology.",
    path: "/word-search",
    icon: Grid3X3,
    difficulty: "Easy",
    duration: "5-10 min",
    skills: ["Recognition", "Focus"],
  },
  {
    title: "True or False",
    description: "Quick-fire true or false questions about EHDS regulations. Beat the timer and build your streak!",
    path: "/true-false",
    icon: Zap,
    difficulty: "Medium",
    duration: "3-5 min",
    skills: ["Speed", "Knowledge"],
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "bg-accent/20 text-accent-foreground";
    case "Medium":
      return "bg-secondary text-secondary-foreground";
    case "Hard":
      return "bg-primary/20 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const GamesPage = () => {
  const { totalPoints, currentLevel, unlockedCount, totalCount } = useAchievements();

  return (
    <Layout>
      <Helmet>
        <title>Learning Games | EHDS Explorer</title>
        <meta name="description" content="Interactive games to help you learn and understand the European Health Data Space regulation" />
      </Helmet>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Gamepad2 className="h-8 w-8 text-primary" />
            Learning Games
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Master the EHDS regulation through interactive games. Each game focuses on different aspects of learning, from memorization to comprehension.
          </p>
        </div>

        {/* Stats Bar */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-12">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{totalPoints}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Level {currentLevel.level}</div>
                  <div className="text-xs text-muted-foreground">{currentLevel.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{unlockedCount}/{totalCount}</div>
                  <div className="text-xs text-muted-foreground">Achievements</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.path} to={game.path}>
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <game.icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                    <Badge className={getDifficultyColor(game.difficulty)}>
                      {game.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-3">{game.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3.5 w-3.5" />
                      {game.duration}
                    </span>
                    <span className="text-border">•</span>
                    {game.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs px-2 py-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Achievements CTA */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Track Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn achievements and level up as you play games and explore the regulation.
                  </p>
                </div>
              </div>
              <Link to="/achievements">
                <Badge variant="default" className="cursor-pointer text-sm px-4 py-2">
                  View Achievements →
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GamesPage;
