import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LEGISLATION_STATUSES, STATUS_ORDER, type LegislationStatus } from '@/data/legislationConstants';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LegislationStatusTimelineProps {
  status: LegislationStatus;
  draftDate?: string | null;
  tabledDate?: string | null;
  adoptionDate?: string | null;
  publicationDate?: string | null;
  effectiveDate?: string | null;
  compact?: boolean;
}

const STATUS_DATE_MAP: Record<string, keyof LegislationStatusTimelineProps> = {
  draft: 'draftDate',
  tabled: 'tabledDate',
  adopted: 'adoptionDate',
  published: 'publicationDate',
  in_force: 'effectiveDate'
};

export function LegislationStatusTimeline({
  status,
  draftDate,
  tabledDate,
  adoptionDate,
  publicationDate,
  effectiveDate,
  compact = false
}: LegislationStatusTimelineProps) {
  const dates: Record<string, string | null | undefined> = {
    draft: draftDate,
    tabled: tabledDate,
    adopted: adoptionDate,
    published: publicationDate,
    in_force: effectiveDate
  };

  const currentStatusIndex = STATUS_ORDER.indexOf(status);
  
  // Filter out review and superseded for timeline display
  const timelineStatuses = STATUS_ORDER.filter(s => s !== 'under_review' && s !== 'superseded');

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {timelineStatuses.map((s, index) => {
          const isCompleted = STATUS_ORDER.indexOf(s) <= currentStatusIndex;
          const isCurrent = s === status;
          const config = LEGISLATION_STATUSES[s];
          const date = dates[s];

          return (
            <Tooltip key={s}>
              <TooltipTrigger>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted',
                    isCurrent && 'ring-2 ring-primary ring-offset-2'
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{config.label}</p>
                {date && <p className="text-xs text-muted-foreground">{format(new Date(date), 'MMM d, yyyy')}</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {timelineStatuses.map((s, index) => {
          const isCompleted = STATUS_ORDER.indexOf(s) <= currentStatusIndex;
          const isCurrent = s === status;
          const config = LEGISLATION_STATUSES[s];
          const Icon = config.icon;
          const date = dates[s];

          return (
            <div key={s} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  isCurrent && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                'text-xs mt-1 text-center max-w-[60px]',
                isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}>
                {config.label}
              </span>
              {date && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {format(new Date(date), 'MMM yyyy')}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted -z-0">
        <div 
          className="h-full bg-primary transition-all"
          style={{ 
            width: `${(currentStatusIndex / (timelineStatuses.length - 1)) * 100}%` 
          }}
        />
      </div>
    </div>
  );
}
