import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  X,
  Filter,
  ArrowLeft,
  Network
} from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useAllCrossRegulationReferences,
  CrossRegulationReference,
  getRelationshipInfo,
} from "@/hooks/useCrossRegulationReferences";
import { useArticles } from "@/hooks/useArticles";

// Regulation visual config
const regulationConfig: Record<string, { color: string; label: string }> = {
  GDPR: { color: "#3B82F6", label: "General Data Protection Regulation" },
  "AI Act": { color: "#8B5CF6", label: "Artificial Intelligence Act" },
  MDR: { color: "#10B981", label: "Medical Devices Regulation" },
  "Data Act": { color: "#F97316", label: "Data Act" },
  DGA: { color: "#14B8A6", label: "Data Governance Act" },
};

const relationshipTypes = ["complements", "relates_to", "specifies", "implements", "aligns_with"];

interface NodeData {
  id: string;
  type: "ehds" | "regulation" | "article";
  label: string;
  fullLabel?: string;
  x: number;
  y: number;
  color: string;
  connections: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  reference: CrossRegulationReference;
}

const CrossRegulationMapPage = () => {
  const { data: references = [], isLoading } = useAllCrossRegulationReferences();
  const { data: articles = [] } = useArticles();
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filterRegulations, setFilterRegulations] = useState<string[]>(Object.keys(regulationConfig));
  const [filterRelationships, setFilterRelationships] = useState<string[]>(relationshipTypes);

  // Filter references
  const filteredReferences = useMemo(() => {
    return references.filter(
      (ref) =>
        filterRegulations.includes(ref.regulation_short_name) &&
        filterRelationships.includes(ref.relationship_type)
    );
  }, [references, filterRegulations, filterRelationships]);

  // Build graph data
  const { nodes, edges } = useMemo(() => {
    const nodesMap = new Map<string, NodeData>();
    const edgesArr: EdgeData[] = [];
    
    // Get unique articles that have cross-references
    const articleIds = [...new Set(filteredReferences.map((r) => r.article_id))];
    const regulationNames = [...new Set(filteredReferences.map((r) => r.regulation_short_name))];
    
    // Calculate layout - articles in inner ring, regulations in outer ring
    const centerX = 500;
    const centerY = 400;
    const articleRadius = 180;
    const regulationRadius = 340;
    
    // Add EHDS center node
    nodesMap.set("ehds-center", {
      id: "ehds-center",
      type: "ehds",
      label: "EHDS",
      fullLabel: "European Health Data Space",
      x: centerX,
      y: centerY,
      color: "hsl(var(--primary))",
      connections: articleIds.length,
    });
    
    // Add article nodes in inner ring
    articleIds.forEach((articleId, index) => {
      const angle = (2 * Math.PI * index) / articleIds.length - Math.PI / 2;
      const article = articles.find((a) => a.article_number === articleId);
      const refsCount = filteredReferences.filter((r) => r.article_id === articleId).length;
      
      nodesMap.set(`article-${articleId}`, {
        id: `article-${articleId}`,
        type: "article",
        label: `Art. ${articleId}`,
        fullLabel: article?.title || `Article ${articleId}`,
        x: centerX + Math.cos(angle) * articleRadius,
        y: centerY + Math.sin(angle) * articleRadius,
        color: "hsl(var(--muted-foreground))",
        connections: refsCount,
      });
    });
    
    // Add regulation nodes in outer ring
    regulationNames.forEach((regName, index) => {
      const angle = (2 * Math.PI * index) / regulationNames.length - Math.PI / 2;
      const config = regulationConfig[regName] || { color: "#6B7280", label: regName };
      const refsCount = filteredReferences.filter((r) => r.regulation_short_name === regName).length;
      
      nodesMap.set(`reg-${regName}`, {
        id: `reg-${regName}`,
        type: "regulation",
        label: regName,
        fullLabel: config.label,
        x: centerX + Math.cos(angle) * regulationRadius,
        y: centerY + Math.sin(angle) * regulationRadius,
        color: config.color,
        connections: refsCount,
      });
    });
    
    // Add edges from articles to regulations
    filteredReferences.forEach((ref) => {
      edgesArr.push({
        id: ref.id,
        source: `article-${ref.article_id}`,
        target: `reg-${ref.regulation_short_name}`,
        relationshipType: ref.relationship_type,
        reference: ref,
      });
    });
    
    return { nodes: Array.from(nodesMap.values()), edges: edgesArr };
  }, [filteredReferences, articles]);

  // Highlighted edges when hovering
  const highlightedEdges = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    return new Set(
      edges
        .filter((e) => e.source === hoveredNode || e.target === hoveredNode)
        .map((e) => e.id)
    );
  }, [edges, hoveredNode]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const toggleRegulation = (reg: string) => {
    setFilterRegulations((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const toggleRelationship = (rel: string) => {
    setFilterRelationships((prev) =>
      prev.includes(rel) ? prev.filter((r) => r !== rel) : [...prev, rel]
    );
  };

  // Get related references for selected node
  const selectedNodeRefs = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.type === "article") {
      const articleId = parseInt(selectedNode.id.replace("article-", ""));
      return filteredReferences.filter((r) => r.article_id === articleId);
    }
    if (selectedNode.type === "regulation") {
      const regName = selectedNode.id.replace("reg-", "");
      return filteredReferences.filter((r) => r.regulation_short_name === regName);
    }
    return filteredReferences;
  }, [selectedNode, filteredReferences]);

  return (
    <Layout>
      <Helmet>
        <title>Cross-Regulation Map | EHDS Explorer</title>
        <meta
          name="description"
          content="Explore the regulatory landscape connecting EHDS with GDPR, AI Act, MDR, Data Act, and Data Governance Act."
        />
      </Helmet>

      <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Header */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-serif flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Cross-Regulation Map
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredReferences.length} connections across {nodes.filter(n => n.type === "regulation").length} regulations
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Connections</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Regulations</h3>
                  <div className="space-y-2">
                    {Object.entries(regulationConfig).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`reg-${key}`}
                          checked={filterRegulations.includes(key)}
                          onCheckedChange={() => toggleRegulation(key)}
                        />
                        <Label htmlFor={`reg-${key}`} className="flex items-center gap-2 cursor-pointer">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          {key}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Relationship Types</h3>
                  <div className="space-y-2">
                    {relationshipTypes.map((type) => {
                      const info = getRelationshipInfo(type);
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`rel-${type}`}
                            checked={filterRelationships.includes(type)}
                            onCheckedChange={() => toggleRelationship(type)}
                          />
                          <Label htmlFor={`rel-${type}`} className="cursor-pointer">
                            {info.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1 bg-background/80 backdrop-blur rounded-lg border p-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset} title="Reset View">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-background/90 backdrop-blur rounded-lg border p-3">
          <div className="text-xs font-medium mb-2">Legend</div>
          <div className="space-y-1.5">
            {Object.entries(regulationConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="truncate">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph Canvas */}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading regulatory connections...</p>
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1000 800"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: "center center",
              }}
            >
              {/* Edges */}
              <g>
                {edges.map((edge) => {
                  const source = nodes.find((n) => n.id === edge.source);
                  const target = nodes.find((n) => n.id === edge.target);
                  if (!source || !target) return null;

                  const relInfo = getRelationshipInfo(edge.relationshipType);
                  const isHighlighted = highlightedEdges.has(edge.id) || highlightedEdges.size === 0;

                  return (
                    <motion.line
                      key={edge.id}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={target.color}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 0.6 : 0.15}
                      strokeDasharray={edge.relationshipType === "relates_to" ? "4 2" : ""}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  );
                })}
              </g>

              {/* Nodes */}
              <g>
                {nodes.map((node) => {
                  const isHovered = hoveredNode === node.id;
                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = hoveredNode
                    ? edges.some(
                        (e) =>
                          (e.source === hoveredNode && e.target === node.id) ||
                          (e.target === hoveredNode && e.source === node.id)
                      )
                    : false;
                  const shouldHighlight = !hoveredNode || isHovered || isConnected;

                  const radius =
                    node.type === "ehds" ? 50 :
                    node.type === "regulation" ? 35 :
                    20 + Math.min(node.connections * 2, 10);

                  return (
                    <motion.g
                      key={node.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: isHovered || isSelected ? 1.1 : 1, 
                        opacity: shouldHighlight ? 1 : 0.3 
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => setSelectedNode(node)}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={node.type === "ehds" ? "hsl(var(--primary))" : node.color}
                        stroke={isSelected ? "hsl(var(--ring))" : "transparent"}
                        strokeWidth={3}
                        className="drop-shadow-md"
                      />
                      <text
                        x={node.x}
                        y={node.y + (node.type === "ehds" ? 5 : 4)}
                        textAnchor="middle"
                        fill="white"
                        fontSize={node.type === "ehds" ? 14 : node.type === "regulation" ? 11 : 10}
                        fontWeight="bold"
                        className="pointer-events-none select-none"
                      >
                        {node.label}
                      </text>
                      {node.type === "regulation" && (
                        <text
                          x={node.x}
                          y={node.y + 18}
                          textAnchor="middle"
                          fill="white"
                          fillOpacity={0.8}
                          fontSize={8}
                          className="pointer-events-none select-none"
                        >
                          {node.connections} refs
                        </text>
                      )}
                    </motion.g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-0 right-0 h-full w-80 bg-background border-l shadow-lg z-30"
            >
              <Card className="h-full rounded-none border-0">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <Badge
                      style={{
                        backgroundColor:
                          selectedNode.type === "ehds"
                            ? "hsl(var(--primary))"
                            : selectedNode.color,
                        color: "white",
                      }}
                    >
                      {selectedNode.type === "ehds"
                        ? "EHDS"
                        : selectedNode.type === "regulation"
                        ? "Regulation"
                        : "Article"}
                    </Badge>
                    <CardTitle className="mt-2">{selectedNode.label}</CardTitle>
                    {selectedNode.fullLabel && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedNode.fullLabel}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedNode(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    {selectedNode.connections} connection{selectedNode.connections !== 1 ? "s" : ""}
                  </div>

                  {selectedNode.type === "article" && (
                    <Link to={`/article/${selectedNode.id.replace("article-", "")}`}>
                      <Button variant="outline" size="sm" className="w-full mb-4">
                        View Article
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </Link>
                  )}

                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="space-y-3">
                      {selectedNodeRefs.map((ref) => {
                        const relInfo = getRelationshipInfo(ref.relationship_type);
                        return (
                          <div
                            key={ref.id}
                            className="p-3 rounded-lg bg-muted/50 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium text-sm">
                                  {selectedNode.type === "article"
                                    ? ref.regulation_short_name
                                    : `Article ${ref.article_id}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {ref.provision_reference}
                                  {ref.provision_title && ` - ${ref.provision_title}`}
                                </div>
                              </div>
                              {ref.url && (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0"
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </a>
                              )}
                            </div>
                            <Badge className={`${relInfo.color} text-white text-xs`}>
                              {relInfo.label}
                            </Badge>
                            {ref.description && (
                              <p className="text-xs text-muted-foreground">
                                {ref.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help tooltip */}
        <div className="absolute bottom-4 right-4 z-20">
          <Button variant="outline" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            Click nodes to explore • Drag to pan • Scroll to zoom
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CrossRegulationMapPage;
