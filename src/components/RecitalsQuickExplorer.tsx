import { Link } from "react-router-dom";
import { recitals } from "@/data/recitals";

export const RecitalsQuickExplorer = () => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Recitals provide context about how an article should be interpreted or implemented.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {recitals.map((recital) => (
          <Link
            key={recital.id}
            to={`/recital/${recital.id}`}
            className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-md border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            {recital.id}
          </Link>
        ))}
      </div>
    </div>
  );
};
