import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Network, ArrowRight, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Info, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import { useArticles } from "@/hooks/useArticles";
import { useArticleDependencies, ArticleNode, ArticleLink } from "@/hooks/useArticleDependencies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SEOHead } from "@/components/seo/SEOHead";

type FilterMode = "all" | "most-referenced" | "most-referencing" | "isolated";

const ArticleDependencyGraphPage = () => {
  const navigate = useNavigate();
  const { data: articles, isLoading } = useArticles();
  const { nodes, links, stats } = useArticleDependencies(articles);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const svgWidth = 900;
  const svgHeight = 700;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Filter nodes based on mode
  const filteredNodes = useMemo(() => {
    switch (filterMode) {
      case "most-referenced":
        return nodes.filter((n) => n.inDegree >= 3);
      case "most-referencing":
        return nodes.filter((n) => n.outDegree >= 3);
      case "isolated":
        return nodes.filter((n) => n.inDegree === 0 && n.outDegree === 0);
      default:
        return nodes;
    }
  }, [nodes, filterMode]);

  const filteredArticleNumbers = useMemo(
    () => new Set(filteredNodes.map((n) => n.articleNumber)),
    [filteredNodes]
  );

  const filteredLinks = useMemo(
    () => links.filter((l) => filteredArticleNumbers.has(l.source) && filteredArticleNumbers.has(l.target)),
    [links, filteredArticleNumbers]
  );

  // Position nodes in a spiral layout
  const nodePositions = useMemo(() => {
    const positions = new Map<number, { x: number; y: number }>();
    const total = filteredNodes.length;
    if (total === 0) return positions;

    // Use a spiral layout for organic feel
    const spiralSpacing = 18;
    const startRadius = 60;
    filteredNodes.forEach((node, i) => {
      const angle = i * 0.6;
      const radius = startRadius + spiralSpacing * Math.sqrt(i);
      positions.set(node.articleNumber, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });
    return positions;
  }, [filteredNodes, centerX, centerY]);

  // Get connections for selected article
  const selectedConnections = useMemo(() => {
    if (!selectedArticle) return { incoming: [] as ArticleLink[], outgoing: [] as ArticleLink[] };
    return {
      incoming: filteredLinks.filter((l) => l.target === selectedArticle),
      outgoing: filteredLinks.filter((l) => l.source === selectedArticle),
    };
  }, [selectedArticle, filteredLinks]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.articleNumber === selectedArticle),
    [nodes, selectedArticle]
  );

  // Node size based on degree
  const getNodeRadius = (node: ArticleNode) => {
    const degree = node.inDegree + node.outDegree;
    return Math.max(6, Math.min(18, 6 + degree * 0.8));
  };

  // Node color based on degree
  const getNodeColor = (node: ArticleNode, isHighlighted: boolean) => {
    if (isHighlighted) return "hsl(var(--primary))";
    const degree = node.inDegree + node.outDegree;
    if (degree === 0) return "hsl(var(--muted-foreground) / 0.3)";
    if (degree <= 3) return "hsl(var(--muted-foreground) / 0.6)";
    if (degree <= 8) return "hsl(210 80% 55%)";
    if (degree <= 15) return "hsl(270 70% 55%)";
    return "hsl(340 75% 55%)";
  };

  const isConnected = (articleNum: number) => {
    if (!selectedArticle) return false;
    return (
      articleNum === selectedArticle ||
      selectedConnections.incoming.some((l) => l.source === articleNum) ||
      selectedConnections.outgoing.some((l) => l.target === articleNum)
    );
  };

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as SVGElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedArticle(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Article Dependency Graph | EHDS Explorer"
        description="Visualize how articles in the EHDS Regulation reference each other with an interactive dependency graph."
      />
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              Article Dependency Graph
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore how the 105 EHDS articles reference and depend on each other.{" "}
              <Link to="/content-network" className="text-primary hover:underline">View full content network →</Link>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Articles</SelectItem>
                <SelectItem value="most-referenced">Most Referenced (≥3)</SelectItem>
                <SelectItem value="most-referencing">Most Referencing (≥3)</SelectItem>
                <SelectItem value="isolated">Isolated Articles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Links</div>
            <div className="text-xl font-bold">{stats.totalLinks}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Showing</div>
            <div className="text-xl font-bold">
              {filteredNodes.length}
              <span className="text-sm font-normal text-muted-foreground"> / {nodes.length}</span>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Most Referenced
            </div>
            <div className="text-sm font-bold truncate">
              {stats.mostReferenced ? `Art. ${stats.mostReferenced.articleNumber}` : "—"}
              {stats.mostReferenced && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({stats.mostReferenced.inDegree}×)
                </span>
              )}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> Most Referencing
            </div>
            <div className="text-sm font-bold truncate">
              {stats.mostReferencing ? `Art. ${stats.mostReferencing.articleNumber}` : "—"}
              {stats.mostReferencing && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({stats.mostReferencing.outDegree}×)
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Graph + Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* SVG Graph */}
          <Card className="overflow-hidden relative">
            {/* Zoom controls */}
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={resetView}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height="500"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" className="fill-muted-foreground/40" />
                </marker>
                <marker id="arrowhead-active" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" className="fill-primary" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Links */}
                {filteredLinks.map((link) => {
                  const sourcePos = nodePositions.get(link.source);
                  const targetPos = nodePositions.get(link.target);
                  if (!sourcePos || !targetPos) return null;

                  const isActive =
                    selectedArticle &&
                    (link.source === selectedArticle || link.target === selectedArticle);

                  const isOutgoing = selectedArticle && link.source === selectedArticle;

                  return (
                    <line
                      key={`${link.source}-${link.target}`}
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isActive ? (isOutgoing ? "hsl(var(--primary))" : "hsl(210 80% 55%)") : "hsl(var(--muted-foreground) / 0.12)"}
                      strokeWidth={isActive ? 1.5 : 0.5}
                      markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                      opacity={selectedArticle ? (isActive ? 1 : 0.1) : 0.3}
                      className="transition-opacity duration-200"
                    />
                  );
                })}

                {/* Nodes */}
                {filteredNodes.map((node) => {
                  const pos = nodePositions.get(node.articleNumber);
                  if (!pos) return null;
                  const r = getNodeRadius(node);
                  const highlighted = isConnected(node.articleNumber);
                  const isSelected = node.articleNumber === selectedArticle;
                  const dimmed = selectedArticle && !highlighted;

                  return (
                    <g
                      key={node.articleNumber}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArticle(
                          node.articleNumber === selectedArticle ? null : node.articleNumber
                        );
                      }}
                      opacity={dimmed ? 0.15 : 1}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={r}
                        fill={getNodeColor(node, highlighted)}
                        stroke={isSelected ? "hsl(var(--primary))" : "transparent"}
                        strokeWidth={isSelected ? 2.5 : 0}
                        className="transition-all duration-200"
                      />
                      {(r >= 10 || isSelected || highlighted) && (
                        <text
                          x={pos.x}
                          y={pos.y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-primary-foreground text-[7px] font-bold pointer-events-none select-none"
                        >
                          {node.articleNumber}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </Card>

          {/* Detail Panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                {selectedNode ? `Article ${selectedNode.articleNumber}` : "Select an Article"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium">{selectedNode.title}</p>

                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      {selectedNode.inDegree} incoming
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {selectedNode.outDegree} outgoing
                    </Badge>
                  </div>

                  {selectedConnections.outgoing.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase">
                        References →
                      </h4>
                      <ScrollArea className="max-h-[120px]">
                        <div className="flex flex-wrap gap-1">
                          {selectedConnections.outgoing.map((l) => {
                            const targetNode = nodes.find((n) => n.articleNumber === l.target);
                            return (
                              <Tooltip key={l.target}>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => setSelectedArticle(l.target)}
                                  >
                                    Art. {l.target}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[200px]">
                                  {targetNode?.title}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {selectedConnections.incoming.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase">
                        ← Referenced by
                      </h4>
                      <ScrollArea className="max-h-[120px]">
                        <div className="flex flex-wrap gap-1">
                          {selectedConnections.incoming.map((l) => {
                            const sourceNode = nodes.find((n) => n.articleNumber === l.source);
                            return (
                              <Tooltip key={l.source}>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer text-xs hover:bg-accent"
                                    onClick={() => setSelectedArticle(l.source)}
                                  >
                                    Art. {l.source}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[200px]">
                                  {sourceNode?.title}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/article/${selectedNode.articleNumber}`)}
                  >
                    Read Article {selectedNode.articleNumber}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>Click on any node in the graph to see its dependencies.</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                      <span>Isolated (no references)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/60" />
                      <span>Few connections (1–3)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: "hsl(210 80% 55%)" }} />
                      <span>Moderate (4–8)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: "hsl(270 70% 55%)" }} />
                      <span>High (9–15)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: "hsl(340 75% 55%)" }} />
                      <span>Hub (16+)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Node size reflects total connections. Scroll to zoom, drag to pan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ArticleDependencyGraphPage;
