import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, GitCompare, ArrowRight, FileText, ScrollText, Scale } from "lucide-react";
import { useComparison, ComparisonItemType } from "@/hooks/useComparison";
import { cn } from "@/lib/utils";

const typeIcons: Record<ComparisonItemType, React.ElementType> = {
  article: FileText,
  recital: ScrollText,
  "implementing-act": Scale,
};

const typeLabels: Record<ComparisonItemType, string> = {
  article: "Article",
  recital: "Recital",
  "implementing-act": "Impl. Act",
};

export const ComparisonBar = () => {
  const { items, removeItem, clearItems, itemCount } = useComparison();

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 p-3 animate-in slide-in-from-bottom-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GitCompare className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="text-sm font-medium hidden sm:inline">Compare:</span>
          
          <div className="flex items-center gap-2 flex-wrap">
            {items.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <Badge
                  key={`${item.type}-${item.id}`}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <Icon className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">
                    {item.number !== undefined
                      ? `${typeLabels[item.type]} ${item.number}`
                      : item.title}
                  </span>
                  <button
                    onClick={() => removeItem(item.id, item.type)}
                    className="ml-1 p-0.5 rounded-full hover:bg-background/50 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearItems}
            className="text-muted-foreground"
          >
            Clear
          </Button>
          <Button
            asChild
            size="sm"
            disabled={itemCount < 2}
            className={cn(itemCount < 2 && "opacity-50 pointer-events-none")}
          >
            <Link to="/compare">
              Compare {itemCount}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
