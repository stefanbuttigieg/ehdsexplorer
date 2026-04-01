import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Network, ZoomIn, ZoomOut, RotateCcw, FileText, HelpCircle, BookOpen, Layers, ScrollText, Package, Download } from "lucide-react";
import Layout from "@/components/Layout";
import { useArticles } from "@/hooks/useArticles";
import { useEhdsFaqs } from "@/hooks/useEhdsFaqs";
import { useRecitals } from "@/hooks/useRecitals";
import { useAnnexes } from "@/hooks/useAnnexes";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { useJointActionDeliverables } from "@/hooks/useJointActionDeliverables";
import { useDownloadableResources } from "@/hooks/useDownloadableResources";
import { useContentNetwork, ContentNode, ContentNodeType } from "@/hooks/useContentNetwork";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";

const typeConfig: Record<ContentNodeType, { color: string; icon: typeof FileText; label: string; route: (n: ContentNode) => string }> = {
  article: { color: "hsl(210 80% 55%)", icon: FileText, label: "Articles", route: (n) => `/article/${n.id.replace("art-", "")}` },
  faq: { color: "hsl(45 90% 50%)", icon: HelpCircle, label: "FAQs", route: (n) => `/faqs#faq-${n.id.replace("faq-", "")}` },
  recital: { color: "hsl(150 60% 45%)", icon: ScrollText, label: "Recitals", route: (n) => `/recital/${n.id.replace("rec-", "")}` },
  annex: { color: "hsl(270 60% 55%)", icon: Layers, label: "Annexes", route: (n) => `/annexes/${n.id.replace("anx-", "")}` },
  "implementing-act": { color: "hsl(340 75% 55%)", icon: BookOpen, label: "Impl. Acts", route: (n) => `/implementing-acts/${n.id.replace("ia-", "")}` },
  deliverable: { color: "hsl(25 85% 55%)", icon: Package, label: "Deliverables", route: () => `/tools` },
  resource: { color: "hsl(190 70% 45%)", icon: Download, label: "Resources", route: () => `/tools` },
};

const typeFilters: ContentNodeType[] = ["article", "faq", "recital", "annex", "implementing-act", "deliverable", "resource"];

const ContentNetworkPage = () => {
  const navigate = useNavigate();
  const { data: articles, isLoading: loadingArticles } = useArticles();
  const { data: faqs } = useEhdsFaqs();
  const { data: recitals } = useRecitals();
  const { data: annexes } = useAnnexes();
  const { data: implementingActs } = useImplementingActs();
  const { data: deliverables } = useJointActionDeliverables();
  const { data: resources } = useDownloadableResources();

  const { nodes, links, totalLinks, typeCounts } = useContentNetwork(articles, faqs, recitals, annexes, implementingActs, deliverables, resources);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<ContentNodeType>>(new Set(typeFilters));
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const svgWidth = 1200;
  const svgHeight = 800;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  const toggleType = (t: ContentNodeType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const visibleNodes = useMemo(() => nodes.filter(n => activeTypes.has(n.type)), [nodes, activeTypes]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleLinks = useMemo(() => links.filter(l => visibleIds.has(l.source) && visibleIds.has(l.target)), [links, visibleIds]);

  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();

    const typeAngles: Record<ContentNodeType, number> = {
      article: 0,
      faq: (Math.PI * 2) / 7,
      recital: (Math.PI * 2 * 2) / 7,
      annex: (Math.PI * 2 * 3) / 7,
      "implementing-act": (Math.PI * 2 * 4) / 7,
      deliverable: (Math.PI * 2 * 5) / 7,
      resource: (Math.PI * 2 * 6) / 7,
    };

    const typeGroups: Record<string, ContentNode[]> = {};
    for (const n of visibleNodes) {
      if (!typeGroups[n.type]) typeGroups[n.type] = [];
      typeGroups[n.type].push(n);
    }

    for (const [type, groupNodes] of Object.entries(typeGroups)) {
      const baseAngle = typeAngles[type as ContentNodeType] || 0;
      const sectorSpread = Math.PI * 0.35;
      const baseRadius = type === "article" ? 0 : 280;

      if (type === "article") {
        const sorted = [...groupNodes].sort((a, b) => {
          const aNum = parseInt(a.id.replace("art-", ""));
          const bNum = parseInt(b.id.replace("art-", ""));
          return aNum - bNum;
        });
        sorted.forEach((node, i) => {
          const angle = i * 0.35;
          const radius = 30 + 12 * Math.sqrt(i);
          positions.set(node.id, {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          });
        });
      } else {
        groupNodes.forEach((node, i) => {
          const angle = baseAngle - sectorSpread / 2 + (sectorSpread / Math.max(1, groupNodes.length - 1)) * i;
          const radius = baseRadius + 20 + (i % 3) * 30;
          positions.set(node.id, {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
          });
        });
      }
    }

    return positions;
  }, [visibleNodes, centerX, centerY]);

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return visibleLinks.filter(l => l.source === selectedNode || l.target === selectedNode);
  }, [selectedNode, visibleLinks]);

  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedNode) ids.add(selectedNode);
    for (const l of selectedConnections) {
      ids.add(l.source);
      ids.add(l.target);
    }
    return ids;
  }, [selectedNode, selectedConnections]);

  const selectedNodeData = useMemo(() => nodes.find(n => n.id === selectedNode), [nodes, selectedNode]);

  const getNodeRadius = (node: ContentNode) => {
    if (node.type === "article") return Math.max(5, Math.min(14, 5 + node.degree * 0.5));
    return Math.max(6, Math.min(12, 6 + node.degree * 0.8));
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as SVGElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.2, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const resetView = () => { setZoom(0.85); setPan({ x: 0, y: 0 }); setSelectedNode(null); };

  if (loadingArticles) {
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
        title="EHDS Content Network | Interactive Knowledge Graph"
        description="Explore how Articles, FAQs, Recitals, Annexes, Implementing Acts, Deliverables and Resources in the EHDS Regulation are interconnected."
      />
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" />
              EHDS Content Network
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Interactive knowledge graph linking all EHDS content types
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {typeFilters.map(t => {
            const cfg = typeConfig[t];
            const Icon = cfg.icon;
            const active = activeTypes.has(t);
            const count = typeCounts[t] || 0;
            if (count === 0 && t !== "resource") return null;
            return (
              <Button
                key={t}
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn("text-xs gap-1.5", active && "text-primary-foreground")}
                style={active ? { backgroundColor: cfg.color } : {}}
                onClick={() => toggleType(t)}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
                <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">{count}</Badge>
              </Button>
            );
          })}
          <span className="text-xs text-muted-foreground ml-2">{totalLinks} connections</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <Card className="overflow-hidden relative">
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={resetView}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height="550"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {visibleLinks.map((link, i) => {
                  const sp = nodePositions.get(link.source);
                  const tp = nodePositions.get(link.target);
                  if (!sp || !tp) return null;
                  const isActive = selectedNode && (link.source === selectedNode || link.target === selectedNode);
                  return (
                    <line
                      key={i}
                      x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                      stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.08)"}
                      strokeWidth={isActive ? 1.5 : 0.3}
                      opacity={selectedNode ? (isActive ? 1 : 0.05) : 0.2}
                    />
                  );
                })}

                {visibleNodes.map(node => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;
                  const r = getNodeRadius(node);
                  const cfg = typeConfig[node.type];
                  const isSelected = node.id === selectedNode;
                  const connected = connectedIds.has(node.id);
                  const dimmed = selectedNode && !connected;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id === selectedNode ? null : node.id); }}
                      opacity={dimmed ? 0.1 : 1}
                    >
                      <circle
                        cx={pos.x} cy={pos.y} r={r}
                        fill={cfg.color}
                        stroke={isSelected ? "hsl(var(--foreground))" : "transparent"}
                        strokeWidth={isSelected ? 2 : 0}
                        fillOpacity={connected || !selectedNode ? 0.85 : 0.4}
                      />
                      {(r >= 8 || isSelected) && node.type === "article" && (
                        <text
                          x={pos.x} y={pos.y + 1}
                          textAnchor="middle" dominantBaseline="middle"
                          className="fill-white text-[6px] font-bold pointer-events-none select-none"
                        >
                          {node.id.replace("art-", "")}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedNodeData ? selectedNodeData.label : "Select a node"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNodeData ? (
                <div className="space-y-4">
                  <Badge style={{ backgroundColor: typeConfig[selectedNodeData.type].color }} className="text-white text-xs">
                    {typeConfig[selectedNodeData.type].label}
                  </Badge>
                  <p className="text-sm">{selectedNodeData.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedNodeData.degree} connections</p>

                  {selectedConnections.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1 uppercase">Connected to</h4>
                      <ScrollArea className="max-h-[250px]">
                        <div className="flex flex-wrap gap-1">
                          {selectedConnections.map((l, i) => {
                            const otherId = l.source === selectedNode ? l.target : l.source;
                            const otherNode = nodes.find(n => n.id === otherId);
                            if (!otherNode) return null;
                            const cfg = typeConfig[otherNode.type];
                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer text-xs hover:opacity-80"
                                    style={{ borderColor: cfg.color, color: cfg.color }}
                                    onClick={() => setSelectedNode(otherId)}
                                  >
                                    {otherNode.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-[200px] text-xs">
                                  {otherNode.title}
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
                    onClick={() => navigate(typeConfig[selectedNodeData.type].route(selectedNodeData))}
                  >
                    View {selectedNodeData.label}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>Click any node to explore its connections across all EHDS content.</p>
                  <div className="space-y-1.5 text-xs">
                    {typeFilters.map(t => {
                      const count = typeCounts[t] || 0;
                      if (count === 0 && t !== "resource") return null;
                      return (
                        <div key={t} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: typeConfig[t].color }} />
                          <span>{typeConfig[t].label} ({count})</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Scroll to zoom, drag to pan. Toggle content types above.
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

export default ContentNetworkPage;
