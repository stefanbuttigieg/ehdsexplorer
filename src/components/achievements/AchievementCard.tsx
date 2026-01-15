import { cn } from '@/lib/utils';
import { TIER_COLORS, AchievementTier } from '@/data/achievements';
import { AchievementBadge } from './AchievementBadge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface AchievementCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  requirementValue: number;
  currentValue?: number;
}

export const AchievementCard = ({
  name,
  description,
  icon,
  tier,
  points,
  isUnlocked,
  unlockedAt,
  progress = 0,
  requirementValue,
  currentValue,
}: AchievementCardProps) => {
  const tierColors = TIER_COLORS[tier];
  const progressPercent = currentValue !== undefined 
    ? Math.min((currentValue / requirementValue) * 100, 100)
    : isUnlocked ? 100 : 0;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all duration-300',
        isUnlocked
          ? cn('border-2', tierColors.border, tierColors.bg)
          : 'border-border bg-card hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-4">
        <AchievementBadge
          name={name}
          description={description}
          icon={icon}
          tier={tier}
          isUnlocked={isUnlocked}
          size="md"
          showTooltip={false}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn(
              'font-semibold truncate',
              isUnlocked ? tierColors.text : 'text-foreground'
            )}>
              {name}
            </h3>
            <span className={cn(
              'text-sm font-bold whitespace-nowrap',
              isUnlocked ? tierColors.text : 'text-muted-foreground'
            )}>
              +{points} pts
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
          
          {!isUnlocked && currentValue !== undefined && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{currentValue} / {requirementValue}</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
          
          {isUnlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Unlocked {format(new Date(unlockedAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
      
      {/* Tier badge */}
      <div className={cn(
        'absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        tierColors.bg,
        tierColors.text,
        !isUnlocked && 'opacity-50'
      )}>
        {tier}
      </div>
    </div>
  );
};
