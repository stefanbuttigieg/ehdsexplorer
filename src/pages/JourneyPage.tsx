import { Link } from "react-router-dom";
import {
  Flame, BookOpen, Trophy, Bookmark, ArrowRight, Sparkles, Target,
  GraduationCap, Gamepad2, Medal, Heart, Stethoscope, Laptop, Scale,
} from "lucide-react";
import Layout from "@/components/Layout";
import { SEOHead } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useStudyProgress } from "@/hooks/useStudyProgress";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAchievements } from "@/hooks/useAchievements";
import { useStreak } from "@/hooks/useStreak";
import { useArticles } from "@/hooks/useArticles";
import { useStakeholder, type StakeholderType } from "@/contexts/StakeholderContext";
import { getProgressToNextLevel } from "@/data/achievements";
import { ContinueReading } from "@/components/ContinueReading";

const STAKEHOLDER_NEXT: Record<StakeholderType, { label: string; to: string; icon: typeof Heart }> = {
  citizen: { label: "Explore your data rights", to: "/for/citizens", icon: Heart },
  healthcare: { label: "Review healthcare workflows", to: "/for/healthcare-professionals", icon: Stethoscope },
  developer: { label: "Check the compliance checklist", to: "/for/healthtech", icon: Laptop },
  legal: { label: "Browse implementing acts", to: "/implementing-acts", icon: Scale },
  researcher: { label: "Explore secondary-use rules", to: "/chapter/4", icon: BookOpen },
  policy: { label: "See the regulatory map", to: "/cross-regulation-map", icon: Sparkles },
};

const StatCard = ({
  icon: Icon, label, value, sub, accent,
}: {
  icon: typeof Flame; label: string; value: string | number; sub?: string; accent: string;
}) => (
  <Card className="h-full">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const JourneyPage = () => {
  const { readArticles } = useReadingProgress();
  const { getProgressStats } = useStudyProgress();
  const { bookmarks } = useBookmarks();
  const { totalPoints, currentLevel, unlockedCount, totalCount, userAchievements, definitions } = useAchievements();
  const { current: streak, longest } = useStreak();
  const { data: articles } = useArticles();
  const { activeStakeholder, getStakeholderConfig } = useStakeholder();

  const totalArticles = articles?.length || 105;
  const readCount = readArticles.length;
  const readingPct = Math.round((readCount / totalArticles) * 100);
  const studyStats = getProgressStats();
  const levelPct = getProgressToNextLevel(totalPoints);

  // Most recent unlocked achievements
  const recent = [...userAchievements]
    .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
    .slice(0, 3)
    .map((ua) => definitions.find((d) => d.id === ua.achievement_id))
    .filter(Boolean);

  const stakeholderConfig = activeStakeholder ? getStakeholderConfig(activeStakeholder) : null;
  const next = activeStakeholder ? STAKEHOLDER_NEXT[activeStakeholder] : null;

  return (
    <Layout>
      <SEOHead
        title="My EHDS Journey — Your Progress Dashboard"
        description="Track your EHDS learning journey: reading progress, study mastery, achievements, streaks, and personalized next steps."
        url="/journey"
      />
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              My EHDS Journey
            </h1>
            <p className="text-muted-foreground mt-2">
              {stakeholderConfig
                ? `Your personalized progress as a ${stakeholderConfig.shortLabel.toLowerCase()}.`
                : "Track everything you've explored across the regulation."}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit text-sm py-1.5 px-3">
            <Medal className="h-4 w-4 mr-1.5" />
            Level {currentLevel.level} — {currentLevel.name}
          </Badge>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Flame} label="Day streak" value={streak} sub={longest > streak ? `Best: ${longest}` : "Keep it going!"} accent="bg-orange-500/10 text-orange-500" />
          <StatCard icon={BookOpen} label="Articles read" value={`${readCount}/${totalArticles}`} sub={`${readingPct}% complete`} accent="bg-blue-500/10 text-blue-500" />
          <StatCard icon={Trophy} label="Points earned" value={totalPoints} sub={`${unlockedCount}/${totalCount} badges`} accent="bg-yellow-500/10 text-yellow-500" />
          <StatCard icon={Bookmark} label="Bookmarks" value={bookmarks.length} sub="Saved items" accent="bg-pink-500/10 text-pink-500" />
        </div>

        {/* Personalized next step */}
        {next && (
          <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <next.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary font-medium">Recommended next step</p>
                  <p className="font-semibold">{next.label}</p>
                </div>
              </div>
              <Link to={next.to}>
                <Button>Go <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Progress breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>Reading</span>
                  <span className="text-muted-foreground">{readCount}/{totalArticles}</span>
                </div>
                <Progress value={readingPct} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>Study mastery</span>
                  <span className="text-muted-foreground">{studyStats.mastered} mastered</span>
                </div>
                <Progress value={studyStats.total ? Math.round((studyStats.completed / studyStats.total) * 100) : 0} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>Level {currentLevel.level} → {currentLevel.level + 1}</span>
                  <span className="text-muted-foreground">{totalPoints} pts</span>
                </div>
                <Progress value={levelPct} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/study"><Button variant="outline" size="sm"><GraduationCap className="h-4 w-4 mr-1.5" /> Study Mode</Button></Link>
                <Link to="/games"><Button variant="outline" size="sm"><Gamepad2 className="h-4 w-4 mr-1.5" /> Games</Button></Link>
                <Link to="/achievements"><Button variant="outline" size="sm"><Trophy className="h-4 w-4 mr-1.5" /> Achievements</Button></Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="h-5 w-5 text-primary" /> Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length > 0 ? (
                <ul className="space-y-3">
                  {recent.map((d) => d && (
                    <li key={d.id} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto shrink-0">+{d.points}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No badges yet — start exploring to earn your first one!</p>
                  <Link to="/games"><Button size="sm">Play a game <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Continue reading reuses existing component */}
        <div className="mt-2">
          <ContinueReading />
        </div>
      </div>
    </Layout>
  );
};

export default JourneyPage;