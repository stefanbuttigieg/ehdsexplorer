import { X, Heart, Stethoscope, Scale, FlaskConical, Code, Landmark, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useStakeholder, STAKEHOLDER_CONFIGS, type StakeholderType } from '@/contexts/StakeholderContext';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  Heart: <Heart className="h-4 w-4" />,
  Stethoscope: <Stethoscope className="h-4 w-4" />,
  Scale: <Scale className="h-4 w-4" />,
  FlaskConical: <FlaskConical className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Landmark: <Landmark className="h-4 w-4" />,
};

interface StakeholderFilterProps {
  compact?: boolean;
  className?: string;
}

export function StakeholderFilter({ compact = false, className }: StakeholderFilterProps) {
  const { activeStakeholder, setActiveStakeholder, clearFilter, getStakeholderConfig, isLoading } = useStakeholder();

  const activeConfig = activeStakeholder ? getStakeholderConfig(activeStakeholder) : null;

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Eye className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={activeStakeholder ? "default" : "outline"} 
          size="sm" 
          className={cn(
            "gap-1.5 transition-all",
            activeStakeholder && "bg-primary text-primary-foreground",
            className
          )}
        >
          {activeConfig ? (
            <>
              <span className={cn("flex items-center", !compact && "gap-1.5")}>
                {iconMap[activeConfig.icon]}
                {!compact && (
                  <span className="hidden sm:inline">{activeConfig.shortLabel}</span>
                )}
              </span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              {!compact && <span className="hidden sm:inline">View as...</span>}
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View as Stakeholder
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {activeStakeholder && (
          <>
            <DropdownMenuItem onClick={clearFilter} className="text-muted-foreground">
              <X className="h-4 w-4 mr-2" />
              Clear filter (Show all)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {STAKEHOLDER_CONFIGS.map((config) => (
          <DropdownMenuItem
            key={config.id}
            onClick={() => setActiveStakeholder(config.id)}
            className={cn(
              "flex items-start gap-3 py-2",
              activeStakeholder === config.id && "bg-primary/10"
            )}
          >
            <span className={cn("mt-0.5", config.color)}>
              {iconMap[config.icon]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{config.label}</span>
                {activeStakeholder === config.id && (
                  <Badge variant="secondary" className="h-5 text-xs">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {config.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact badge showing active filter for use in content areas
export function StakeholderFilterBadge({ className }: { className?: string }) {
  const { activeStakeholder, getStakeholderConfig, clearFilter } = useStakeholder();

  if (!activeStakeholder) return null;

  const config = getStakeholderConfig(activeStakeholder);
  if (!config) return null;

  return (
    <Badge 
      variant="secondary" 
      className={cn("gap-1.5 cursor-pointer hover:bg-secondary/80", className)}
      onClick={clearFilter}
    >
      <span className={config.color}>{iconMap[config.icon]}</span>
      <span>Viewing as {config.shortLabel}</span>
      <X className="h-3 w-3 ml-1 hover:text-destructive" />
    </Badge>
  );
}
