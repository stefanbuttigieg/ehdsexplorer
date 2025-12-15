import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TourButtonProps {
  onClick: () => void;
  variant?: 'icon' | 'full';
}

export const TourButton = ({ onClick, variant = 'icon' }: TourButtonProps) => {
  if (variant === 'full') {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={onClick}
      >
        <HelpCircle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">Take a Tour</span>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClick}>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Take a guided tour</p>
      </TooltipContent>
    </Tooltip>
  );
};
