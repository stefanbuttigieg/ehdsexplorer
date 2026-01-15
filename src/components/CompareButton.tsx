import { Button } from "@/components/ui/button";
import { GitCompare, Check } from "lucide-react";
import { useComparison, ComparisonItem } from "@/hooks/useComparison";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CompareButtonProps {
  item: ComparisonItem;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export const CompareButton = ({
  item,
  variant = "outline",
  size = "sm",
  showLabel = false,
}: CompareButtonProps) => {
  const { isInComparison, toggleItem, canAddMore } = useComparison();
  const isSelected = isInComparison(item.id, item.type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(item);
  };

  const buttonContent = (
    <Button
      variant={isSelected ? "default" : variant}
      size={size}
      onClick={handleClick}
      disabled={!isSelected && !canAddMore}
      className={isSelected ? "bg-primary text-primary-foreground" : ""}
    >
      {isSelected ? (
        <Check className="h-4 w-4" />
      ) : (
        <GitCompare className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isSelected ? "In comparison" : "Compare"}
        </span>
      )}
    </Button>
  );

  if (showLabel) {
    return buttonContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
      <TooltipContent>
        {isSelected
          ? "Remove from comparison"
          : canAddMore
          ? "Add to comparison"
          : "Comparison full (max 4)"}
      </TooltipContent>
    </Tooltip>
  );
};
