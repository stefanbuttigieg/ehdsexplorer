import { ExternalLink, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CrossRegulationReference,
  getRelationshipInfo,
} from "@/hooks/useCrossRegulationReferences";

// Regulation colors for visual identification
const regulationColors: Record<string, string> = {
  GDPR: "from-blue-600 to-blue-800",
  "AI Act": "from-purple-600 to-purple-800",
  MDR: "from-green-600 to-green-800",
  "Data Act": "from-orange-600 to-orange-800",
  DGA: "from-teal-600 to-teal-800",
};

interface CrossRegulationCardProps {
  references: CrossRegulationReference[];
  regulationName: string;
  regulationShortName: string;
}

export const CrossRegulationCard = ({
  references,
  regulationName,
  regulationShortName,
}: CrossRegulationCardProps) => {
  const gradient = regulationColors[regulationShortName] || "from-gray-600 to-gray-800";

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`bg-gradient-to-r ${gradient} text-white py-3`}>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          {regulationShortName}
          <span className="text-xs font-normal opacity-80">
            ({references.length} provision{references.length !== 1 ? "s" : ""})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {references.map((ref) => {
            const relationshipInfo = getRelationshipInfo(ref.relationship_type);
            
            return (
              <div key={ref.id} className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {ref.provision_reference}
                      </span>
                      {ref.provision_title && (
                        <span className="text-muted-foreground text-sm truncate">
                          — {ref.provision_title}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="secondary"
                            className={`${relationshipInfo.color} text-white text-xs`}
                          >
                            {relationshipInfo.label}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {relationshipInfo.description}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    {ref.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {ref.description}
                      </p>
                    )}
                  </div>
                  
                  {ref.url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      asChild
                    >
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${ref.provision_reference} in EUR-Lex`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
