import { useState } from "react";
import { Scale, Network, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCrossRegulationReferences,
  groupByRegulation,
} from "@/hooks/useCrossRegulationReferences";
import { CrossRegulationCard } from "@/components/CrossRegulationCard";
import { RegulationRelationshipMap } from "@/components/RegulationRelationshipMap";

interface CrossRegulationSectionProps {
  articleId: number;
}

export const CrossRegulationSection = ({ articleId }: CrossRegulationSectionProps) => {
  const [viewMode, setViewMode] = useState<"cards" | "map">("cards");
  const { data: references, isLoading } = useCrossRegulationReferences(articleId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!references || references.length === 0) {
    return null;
  }

  const groupedReferences = groupByRegulation(references);
  const regulationGroups = Object.values(groupedReferences);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Related EU Regulations
        </h3>
        
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="h-7 px-2"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("map")}
            className="h-7 px-2"
          >
            <Network className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {regulationGroups.map((group) => (
            <CrossRegulationCard
              key={group.shortName}
              references={group.references}
              regulationName={group.name}
              regulationShortName={group.shortName}
            />
          ))}
        </div>
      ) : (
        <RegulationRelationshipMap
          articleId={articleId}
          references={references}
        />
      )}

      <p className="text-xs text-muted-foreground">
        {references.length} cross-reference{references.length !== 1 ? "s" : ""} found across{" "}
        {regulationGroups.length} regulation{regulationGroups.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
};
