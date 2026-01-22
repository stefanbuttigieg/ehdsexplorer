import { useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  CrossRegulationReference,
  getRelationshipInfo,
} from "@/hooks/useCrossRegulationReferences";

interface RegulationRelationshipMapProps {
  articleId: number;
  references: CrossRegulationReference[];
}

// Regulation visual config
const regulationConfig: Record<string, { color: string; bgColor: string; position: { x: number; y: number } }> = {
  GDPR: { color: "#3B82F6", bgColor: "bg-blue-500", position: { x: 0, y: -1 } },
  "AI Act": { color: "#8B5CF6", bgColor: "bg-purple-500", position: { x: 1, y: -0.5 } },
  MDR: { color: "#10B981", bgColor: "bg-green-500", position: { x: 1, y: 0.5 } },
  "Data Act": { color: "#F97316", bgColor: "bg-orange-500", position: { x: -1, y: 0.5 } },
  DGA: { color: "#14B8A6", bgColor: "bg-teal-500", position: { x: -1, y: -0.5 } },
};

export const RegulationRelationshipMap = ({
  articleId,
  references,
}: RegulationRelationshipMapProps) => {
  // Group by regulation
  const regulationNodes = useMemo(() => {
    const grouped = references.reduce((acc, ref) => {
      if (!acc[ref.regulation_short_name]) {
        acc[ref.regulation_short_name] = {
          shortName: ref.regulation_short_name,
          fullName: ref.regulation_name,
          references: [],
        };
      }
      acc[ref.regulation_short_name].references.push(ref);
      return acc;
    }, {} as Record<string, { shortName: string; fullName: string; references: CrossRegulationReference[] }>);
    
    return Object.values(grouped);
  }, [references]);

  // Calculate positions based on number of regulations
  const getPosition = (index: number, total: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    const radius = 120;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const containerSize = 320;
  const center = containerSize / 2;

  return (
    <div className="relative bg-muted/30 rounded-lg p-4 overflow-hidden">
      <svg
        width={containerSize}
        height={containerSize}
        className="mx-auto"
        viewBox={`0 0 ${containerSize} ${containerSize}`}
      >
        {/* Connection lines */}
        {regulationNodes.map((node, index) => {
          const pos = getPosition(index, regulationNodes.length);
          const config = regulationConfig[node.shortName] || { color: "#6B7280" };
          
          return (
            <motion.line
              key={`line-${node.shortName}`}
              x1={center}
              y1={center}
              x2={center + pos.x}
              y2={center + pos.y}
              stroke={config.color}
              strokeWidth={Math.min(4, node.references.length + 1)}
              strokeOpacity={0.5}
              strokeDasharray="4 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            />
          );
        })}

        {/* Center node (EHDS Article) */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <circle
            cx={center}
            cy={center}
            r={36}
            className="fill-primary"
          />
          <text
            x={center}
            y={center - 6}
            textAnchor="middle"
            className="fill-primary-foreground text-[10px] font-bold"
          >
            EHDS
          </text>
          <text
            x={center}
            y={center + 8}
            textAnchor="middle"
            className="fill-primary-foreground text-xs font-medium"
          >
            Art. {articleId}
          </text>
        </motion.g>

        {/* Regulation nodes */}
        {regulationNodes.map((node, index) => {
          const pos = getPosition(index, regulationNodes.length);
          const config = regulationConfig[node.shortName] || { color: "#6B7280", bgColor: "bg-gray-500" };
          const nodeX = center + pos.x;
          const nodeY = center + pos.y;

          return (
            <motion.g
              key={node.shortName}
              initial={{ scale: 0, x: center, y: center }}
              animate={{ scale: 1, x: 0, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: 0.2 + index * 0.1 
              }}
            >
              <circle
                cx={nodeX}
                cy={nodeY}
                r={28}
                fill={config.color}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <text
                x={nodeX}
                y={nodeY - 4}
                textAnchor="middle"
                className="fill-white text-[9px] font-bold pointer-events-none"
              >
                {node.shortName}
              </text>
              <text
                x={nodeX}
                y={nodeY + 8}
                textAnchor="middle"
                className="fill-white/80 text-[8px] pointer-events-none"
              >
                {node.references.length} ref{node.references.length !== 1 ? "s" : ""}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Legend / Details */}
      <div className="mt-4 space-y-2">
        {regulationNodes.map((node) => {
          const config = regulationConfig[node.shortName] || { bgColor: "bg-gray-500" };
          
          return (
            <div key={node.shortName} className="flex items-start gap-2">
              <Badge className={`${config.bgColor} text-white shrink-0`}>
                {node.shortName}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{node.fullName}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.references.map((ref) => {
                    const relInfo = getRelationshipInfo(ref.relationship_type);
                    return (
                      <Tooltip key={ref.id}>
                        <TooltipTrigger asChild>
                          <a
                            href={ref.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                          >
                            {ref.provision_reference}
                            {ref.url && <ExternalLink className="h-2.5 w-2.5" />}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="font-medium">{ref.provision_reference}</div>
                          {ref.provision_title && (
                            <div className="text-muted-foreground">{ref.provision_title}</div>
                          )}
                          <Badge className={`${relInfo.color} text-white text-[10px] mt-1`}>
                            {relInfo.label}
                          </Badge>
                          {ref.description && (
                            <p className="text-xs mt-1">{ref.description}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
