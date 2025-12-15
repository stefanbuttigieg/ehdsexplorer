import { ExternalLink, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ELI_LINKS } from "./JsonLdMetadata";

interface EliReferenceProps {
  type: "article" | "recital" | "regulation";
  number?: number;
  showLabel?: boolean;
}

export const EliReference = ({
  type,
  number,
  showLabel = true,
}: EliReferenceProps) => {
  const getEliUrl = () => {
    if (type === "article" && number) {
      return ELI_LINKS.getArticleEli(number);
    }
    if (type === "recital" && number) {
      return ELI_LINKS.getRecitalEli(number);
    }
    return ELI_LINKS.base;
  };

  const getEurLexUrl = () => {
    if (type === "article" && number) {
      return `${ELI_LINKS.eurLex}#art_${number}`;
    }
    if (type === "recital" && number) {
      return `${ELI_LINKS.eurLex}#rec_${number}`;
    }
    return ELI_LINKS.eurLex;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={getEurLexUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Scale className="h-3 w-3" />
              {showLabel && <span>EUR-Lex</span>}
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>View on EUR-Lex (Official EU Law)</p>
          </TooltipContent>
        </Tooltip>

        <span className="text-border">|</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 font-mono text-[10px]">
              ELI: {type === "regulation" ? "reg/2025/327" : `${type.slice(0, 3)}_${number}`}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>European Legislation Identifier</p>
            <p className="text-xs text-muted-foreground mt-1">{getEliUrl()}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
