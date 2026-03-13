import { Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useKidsMode } from "@/contexts/KidsModeContext";
import { cn } from "@/lib/utils";

export const KidsModeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { isKidsMode, toggleKidsMode } = useKidsMode();

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isKidsMode ? "default" : "ghost"}
            size="icon"
            onClick={toggleKidsMode}
            className={cn(
              "h-8 w-8 transition-all",
              isKidsMode && "bg-orange-500 hover:bg-orange-600 text-white"
            )}
            aria-label={isKidsMode ? "Disable Kids Mode" : "Enable Kids Mode"}
          >
            <Baby className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isKidsMode ? "Exit Kids Mode" : "Kids Mode"}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={isKidsMode ? "default" : "outline"}
      size="sm"
      onClick={toggleKidsMode}
      className={cn(
        "gap-2 transition-all",
        isKidsMode && "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
      )}
    >
      <Baby className="h-4 w-4" />
      {isKidsMode ? "Exit Kids Mode" : "Kids Mode"}
    </Button>
  );
};
