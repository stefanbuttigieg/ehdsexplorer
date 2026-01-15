import Layout from '@/components/Layout';
import { AchievementsGrid } from '@/components/achievements/AchievementsGrid';
import { AchievementProgress } from '@/components/achievements/AchievementProgress';
import { useAchievements } from '@/hooks/useAchievements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementBadge } from '@/components/achievements/AchievementBadge';
import { AchievementTier } from '@/data/achievements';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AchievementsPage = () => {
  const { userAchievements, definitions, isLoggedIn } = useAchievements();

  // Get recent unlocks (last 5)
  const recentUnlocks = [...userAchievements]
    .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
    .slice(0, 5)
    .map(ua => {
      const def = definitions.find(d => d.id === ua.achievement_id);
      return def ? { ...def, unlockedAt: ua.unlocked_at } : null;
    })
    .filter(Boolean);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and unlock achievements as you explore the EHDS regulation.
          </p>
        </div>

        {!isLoggedIn && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your achievements are saved locally. Sign in to sync your progress across devices!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progress Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <AchievementProgress />
            </CardContent>
          </Card>

          {/* Recent Unlocks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Unlocks</CardTitle>
            </CardHeader>
            <CardContent>
              {recentUnlocks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recentUnlocks.map((achievement) => (
                    achievement && (
                      <AchievementBadge
                        key={achievement.id}
                        name={achievement.name}
                        description={achievement.description}
                        icon={achievement.icon}
                        tier={achievement.tier as AchievementTier}
                        isUnlocked={true}
                        size="md"
                      />
                    )
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start reading articles to unlock your first achievement!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>All Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <AchievementsGrid showFilters={true} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AchievementsPage;
