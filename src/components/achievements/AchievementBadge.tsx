import { cn } from '@/lib/utils';
import { TIER_COLORS, AchievementTier } from '@/data/achievements';
import { 
  BookOpen, Book, BookMarked, Library, GraduationCap,
  Flag, HeartPulse, Monitor, FlaskConical, Crown,
  Search, Brain, Award, Puzzle, Zap, CheckCircle, Layers,
  Bookmark, BookmarkPlus, FileText, Edit3,
  Flame, ScrollText, BookCopy, Bell, Lock, Trophy
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  'book': Book,
  'book-marked': BookMarked,
  'library': Library,
  'graduation-cap': GraduationCap,
  'flag': Flag,
  'heart-pulse': HeartPulse,
  'monitor': Monitor,
  'flask-conical': FlaskConical,
  'crown': Crown,
  'search': Search,
  'brain': Brain,
  'award': Award,
  'puzzle': Puzzle,
  'zap': Zap,
  'check-circle': CheckCircle,
  'layers': Layers,
  'bookmark': Bookmark,
  'bookmark-plus': BookmarkPlus,
  'file-text': FileText,
  'edit-3': Edit3,
  'flame': Flame,
  'fire': Flame,
  'scroll': ScrollText,
  'book-copy': BookCopy,
  'bell': Bell,
  'trophy': Trophy,
};

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  isUnlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const AchievementBadge = ({
  name,
  description,
  icon,
  tier,
  isUnlocked,
  size = 'md',
  showTooltip = true,
}: AchievementBadgeProps) => {
  const IconComponent = ICON_MAP[icon] || Trophy;
  const tierColors = TIER_COLORS[tier];
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const badge = (
    <div
      className={cn(
        'relative rounded-full border-2 flex items-center justify-center transition-all duration-300',
        sizeClasses[size],
        isUnlocked
          ? cn(tierColors.bg, tierColors.border, 'shadow-lg', tierColors.glow)
          : 'bg-muted/50 border-muted-foreground/20 opacity-50 grayscale'
      )}
    >
      {isUnlocked ? (
        <IconComponent className={cn(iconSizeClasses[size], tierColors.text)} />
      ) : (
        <Lock className={cn(iconSizeClasses[size], 'text-muted-foreground/50')} />
      )}
      
      {/* Tier indicator dot */}
      {isUnlocked && size !== 'sm' && (
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background',
            tier === 'bronze' && 'bg-amber-600',
            tier === 'silver' && 'bg-slate-400',
            tier === 'gold' && 'bg-yellow-500',
            tier === 'platinum' && 'bg-indigo-500'
          )}
        />
      )}
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <p className={cn('text-xs font-medium capitalize', tierColors.text)}>
            {tier} Achievement
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
