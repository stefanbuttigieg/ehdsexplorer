import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export const RecitalsQuickExplorer = () => {
  const { data: recitals, isLoading } = useQuery({
    queryKey: ['recitals-explorer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recitals')
        .select('id, recital_number, content')
        .order('recital_number', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Recitals provide context about how an article should be interpreted or implemented.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 50 }).map((_, i) => (
            <Skeleton key={i} className="w-9 h-9 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Recitals provide context about how an article should be interpreted or implemented.
      </p>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-1.5">
          {recitals?.map((recital) => (
            <Tooltip key={recital.id}>
              <TooltipTrigger asChild>
                <Link
                  to={`/recital/${recital.recital_number}`}
                  className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-md border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {recital.recital_number}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs line-clamp-3">{recital.content}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};
