import Layout from "@/components/Layout";
import { useLeaderboard, CountryScore } from "@/hooks/useLeaderboard";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, BookOpen, Gamepad2, Compass, Award, Users, Globe, Medal, Info, ChevronDown, ChevronUp, Scale } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MEDAL_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-700"];
const MEDAL_ICONS = [Trophy, Medal, Medal];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const Icon = MEDAL_ICONS[rank - 1];
    return (
      <div className={cn("flex items-center gap-1 font-bold text-lg", MEDAL_COLORS[rank - 1])}>
        <Icon className="h-5 w-5" />
        #{rank}
      </div>
    );
  }
  return <span className="text-muted-foreground font-semibold text-lg">#{rank}</span>;
}

function StatBar({
  label,
  value,
  max,
  total,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  max: number;
  total: number;
  icon: React.ElementType;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const share = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-medium tabular-nums">
          {value.toLocaleString()} <span className="text-muted-foreground text-xs">({share}%)</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CountryCard({ score, rank, maxPoints, weighted }: { score: CountryScore; rank: number; maxPoints: number; weighted: boolean }) {
  const ptsPerContributor = score.contributor_count > 0
    ? Math.round(score.total_points / score.contributor_count)
    : 0;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      rank <= 3 && "border-primary/30 bg-primary/5"
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 min-w-[3rem]">
            <RankBadge rank={rank} />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CountryFlag countryCode={score.country_code} size="md" />
              <h3 className="font-semibold text-lg truncate">{score.country_name}</h3>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {weighted && score.population > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs gap-1">
                          <Scale className="h-3 w-3" />
                          {score.weighted_score.toLocaleString()} pts/M
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Points per million inhabitants (pop: {score.population}M)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Badge variant="secondary">
                  {score.total_points.toLocaleString()} pts
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {score.contributor_count} contributor{score.contributor_count !== 1 ? "s" : ""}
              </span>
              <span className="tabular-nums">
                ~{ptsPerContributor} pts/contributor
              </span>
              {score.population > 0 && (
                <span className="tabular-nums text-xs">
                  Pop: {score.population}M
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <StatBar label="Reading" value={score.reading_points} max={maxPoints} total={score.total_points} icon={BookOpen} color="bg-blue-500" />
              <StatBar label="Games" value={score.games_points} max={maxPoints} total={score.total_points} icon={Gamepad2} color="bg-green-500" />
              <StatBar label="Exploration" value={score.exploration_points} max={maxPoints} total={score.total_points} icon={Compass} color="bg-purple-500" />
              <StatBar label="Achievements" value={score.achievements_points} max={maxPoints} total={score.total_points} icon={Award} color="bg-orange-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
const POINTS_DATA = [
  { activity: "Read an Article", category: "Reading", points: "3", icon: BookOpen },
  { activity: "Read a Recital", category: "Reading", points: "2", icon: BookOpen },
  { activity: "Read an Annex", category: "Reading", points: "2", icon: BookOpen },
  { activity: "Read an Implementing Act", category: "Reading", points: "2", icon: BookOpen },
  { activity: "Quiz — per correct answer", category: "Games", points: "5", icon: Gamepad2 },
  { activity: "Flashcards, Match, True/False, etc.", category: "Games", points: "1–10", icon: Gamepad2 },
  { activity: "Visit Definitions page", category: "Exploration", points: "1", icon: Compass },
  { activity: "Visit Overview page", category: "Exploration", points: "1", icon: Compass },
  { activity: "Visit a 'For…' page", category: "Exploration", points: "1", icon: Compass },
  { activity: "Visit Health Authorities", category: "Exploration", points: "1", icon: Compass },
  { activity: "Visit Cross-Regulation Map", category: "Exploration", points: "1", icon: Compass },
  { activity: "Visit Topic Index", category: "Exploration", points: "1", icon: Compass },
  { activity: "Unlock achievements", category: "Achievements", points: "Varies", icon: Award },
];

function PointsScoringGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">How are points calculated?</CardTitle>
              </div>
              {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              Points are earned automatically as you use EHDS Explorer. Each page visit or game completion is tracked once per session to keep things fair. Your country is detected by IP or can be set in your profile.
            </p>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Activity</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {POINTS_DATA.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm py-2">{row.activity}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-xs">
                          <row.icon className="h-3 w-3 mr-1" />
                          {row.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums font-medium py-2">{row.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Each page visit counts once per session. Game scores reflect your performance (e.g. 5 pts × correct answers in Quiz). Logged-in users can choose their country from their Profile page.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-8 w-12" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                  <Skeleton className="h-2 w-1/3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<"all" | "month" | "week">("all");
  const { data: scores, isLoading } = useLeaderboard(timeRange);

  const maxCategoryPoints = scores?.reduce(
    (max, s) => Math.max(max, s.reading_points, s.games_points, s.exploration_points, s.achievements_points),
    1
  ) ?? 1;

  const totalCountries = scores?.length ?? 0;
  const totalPoints = scores?.reduce((sum, s) => sum + s.total_points, 0) ?? 0;
  const totalContributors = scores?.reduce((sum, s) => sum + s.contributor_count, 0) ?? 0;

  return (
    <Layout>
      <SEOHead
        title="Country Leaderboard | EHDS Explorer"
        description="See which countries are leading in EHDS knowledge exploration. Compete by reading articles, playing games, and earning achievements."
      />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif">Country Leaderboard</h1>
              <p className="text-muted-foreground">
                Which country knows EHDS best? Read, play, and explore to earn points for your nation!
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalCountries}</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalContributors}</p>
              <p className="text-xs text-muted-foreground">Contributors</p>
            </CardContent>
          </Card>
        </div>

        {/* Points Scoring Explainer */}
        <PointsScoringGuide />

        {/* Time Filter */}
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
          </TabsList>

          <TabsContent value={timeRange} className="mt-4">
            {isLoading ? (
              <LeaderboardSkeleton />
            ) : scores && scores.length > 0 ? (
              <div className="space-y-3">
                {scores.map((score, i) => (
                  <CountryCard
                    key={score.country_code}
                    score={score}
                    rank={i + 1}
                    maxPoints={maxCategoryPoints}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No scores yet!</h3>
                  <p className="text-muted-foreground">
                    Be the first to contribute. Read articles, play games, and explore EHDS content to earn points for your country.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
