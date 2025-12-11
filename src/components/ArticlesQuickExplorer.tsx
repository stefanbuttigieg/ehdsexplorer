import { Link } from "react-router-dom";
import { useArticles } from "@/hooks/useArticles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export const ArticlesQuickExplorer = () => {
  const { data: articles, isLoading } = useArticles();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Loading articles...</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 105 }).map((_, i) => (
            <Skeleton key={i} className="w-9 h-9 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Click on any article number to read its full text, or hover to see its title.
      </p>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-1.5">
          {articles?.map((article) => (
            <Tooltip key={article.article_number}>
              <TooltipTrigger asChild>
                <Link
                  to={`/article/${article.article_number}`}
                  className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-md border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {article.article_number}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs font-medium">{article.title}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};
