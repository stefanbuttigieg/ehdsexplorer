import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ENFORCEMENT_MEASURES, type EnforcementMeasure } from '@/data/legislationConstants';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EnforcementMeasuresBadgesProps {
  measures: EnforcementMeasure[];
  details?: Record<string, unknown>;
  maxVisible?: number;
  showLabels?: boolean;
}

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export function EnforcementMeasuresBadges({
  measures,
  details = {},
  maxVisible = 3,
  showLabels = false
}: EnforcementMeasuresBadgesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!measures || measures.length === 0) {
    return (
      <span className="text-sm text-muted-foreground italic">
        No enforcement measures defined
      </span>
    );
  }

  const visibleMeasures = isExpanded ? measures : measures.slice(0, maxVisible);
  const hiddenCount = measures.length - maxVisible;

  const getDetailText = (measure: EnforcementMeasure) => {
    const detail = details[measure];
    if (!detail || typeof detail !== 'object') return null;
    
    const d = detail as Record<string, string>;
    
    switch (measure) {
      case 'administrative_fines':
        return d.max_amount ? `Up to ${d.currency || '€'}${d.max_amount}` : d.description;
      case 'audits':
        return d.frequency ? `${d.frequency} audits` : null;
      case 'guidelines':
        return d.title || d.issued_by;
      default:
        return d.description;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleMeasures.map((measure) => {
          const config = ENFORCEMENT_MEASURES[measure];
          if (!config) return null;
          
          const Icon = config.icon;
          const detailText = getDetailText(measure);

          return (
            <Tooltip key={measure}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline"
                  className={cn(
                    'gap-1 cursor-default',
                    SEVERITY_COLORS[config.severity]
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {showLabels && <span>{config.label}</span>}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{config.label}</p>
                {detailText && (
                  <p className="text-xs text-muted-foreground">{detailText}</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {hiddenCount > 0 && !isExpanded && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              +{hiddenCount} more
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
      
      <CollapsibleContent>
        {/* This is handled by the isExpanded state above */}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EnforcementMeasuresList({
  measures,
  details = {}
}: {
  measures: EnforcementMeasure[];
  details?: Record<string, unknown>;
}) {
  if (!measures || measures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No enforcement measures defined
      </p>
    );
  }

  const getDetailText = (measure: EnforcementMeasure) => {
    const detail = details[measure];
    if (!detail || typeof detail !== 'object') return null;
    
    const d = detail as Record<string, string>;
    return d.description || d.title;
  };

  return (
    <ul className="space-y-2">
      {measures.map((measure) => {
        const config = ENFORCEMENT_MEASURES[measure];
        if (!config) return null;
        
        const Icon = config.icon;
        const detailText = getDetailText(measure);

        return (
          <li key={measure} className="flex items-start gap-2">
            <div className={cn(
              'p-1 rounded',
              SEVERITY_COLORS[config.severity]
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-medium text-sm">{config.label}</span>
              {detailText && (
                <p className="text-xs text-muted-foreground">{detailText}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
