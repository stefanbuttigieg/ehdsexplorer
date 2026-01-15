import { useAchievements } from '@/hooks/useAchievements';
import { AchievementCard } from './AchievementCard';
import { CATEGORY_LABELS, AchievementCategory, AchievementTier } from '@/data/achievements';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface AchievementsGridProps {
  showFilters?: boolean;
}

export const AchievementsGrid = ({ showFilters = true }: AchievementsGridProps) => {
  const { definitions, getByCategory, unlockedCount, totalCount } = useAchievements();

  const categories = Object.keys(CATEGORY_LABELS) as AchievementCategory[];

  const renderAchievements = (category: AchievementCategory) => {
    const achievements = getByCategory(category);
    
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            id={achievement.id}
            name={achievement.name}
            description={achievement.description}
            icon={achievement.icon}
            tier={achievement.tier as AchievementTier}
            points={achievement.points}
            isUnlocked={achievement.isUnlocked}
            unlockedAt={achievement.unlockedAt}
            progress={achievement.progress}
            requirementValue={achievement.requirement_value}
          />
        ))}
      </div>
    );
  };

  if (!showFilters) {
    // Show all achievements in a simple grid
    return (
      <div className="space-y-8">
        {categories.map((category) => {
          const achievements = getByCategory(category);
          const unlockedInCategory = achievements.filter(a => a.isUnlocked).length;
          
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h3>
                <Badge variant="secondary">
                  {unlockedInCategory}/{achievements.length}
                </Badge>
              </div>
              {renderAchievements(category)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
        <TabsTrigger value="all" className="flex items-center gap-2">
          All
          <Badge variant="secondary" className="ml-1">
            {unlockedCount}/{totalCount}
          </Badge>
        </TabsTrigger>
        {categories.map((category) => {
          const achievements = getByCategory(category);
          const unlockedInCategory = achievements.filter(a => a.isUnlocked).length;
          
          return (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              {CATEGORY_LABELS[category]}
              <Badge variant="secondary" className="ml-1">
                {unlockedInCategory}/{achievements.length}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="all">
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">{CATEGORY_LABELS[category]}</h3>
              {renderAchievements(category)}
            </div>
          ))}
        </div>
      </TabsContent>

      {categories.map((category) => (
        <TabsContent key={category} value={category}>
          {renderAchievements(category)}
        </TabsContent>
      ))}
    </Tabs>
  );
};
