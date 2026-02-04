import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Filter,
  FileText,
  Globe,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  ChevronDown,
  Paperclip
} from "lucide-react";
import { ObligationEvidenceManager } from "@/components/ObligationEvidenceManager";
import { useObligationEvidence } from "@/hooks/useObligationEvidence";
import { useAuth } from "@/hooks/useAuth";
import { useCountryAssignments } from "@/hooks/useCountryAssignments";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useImplementationTrackerConfig } from "@/hooks/useImplementationTrackerConfig";
import { 
  useEhdsObligations, 
  useCountryObligationStatuses,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  type ObligationCategory,
  type ObligationStatus,
  type EhdsObligation
} from "@/hooks/useEhdsObligations";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" }, { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" }, { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" }, { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" }, { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" }, { code: "NL", name: "Netherlands" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" }, { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" }, { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" }
];

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const CATEGORY_ICONS: Record<ObligationCategory, React.ReactNode> = {
  primary_use: <FileText className="h-4 w-4" />,
  secondary_use: <Globe className="h-4 w-4" />,
  general: <Shield className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<ObligationCategory, string> = {
  primary_use: "bg-chart-1",
  secondary_use: "bg-chart-2",
  general: "bg-chart-4",
};

const getStatusIcon = (status: ObligationStatus) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "partial": return <Circle className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case "in_progress": return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case "not_started": return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

interface CountryProgress {
  countryCode: string;
  countryName: string;
  primaryUseProgress: number;
  secondaryUseProgress: number;
  generalProgress: number;
  overallProgress: number;
  completedObligations: number;
  totalObligations: number;
  obligationStatuses: Record<string, ObligationStatus>;
}

interface ImplementationTimelineTrackerProps {
  showKeyDates?: boolean;
  keyDates?: Array<{ label: string; date: string; category?: string }>;
}

// Obligation card with evidence support
const ObligationCard = ({ 
  obligation, 
  selectedCountry,
  canEdit 
}: { 
  obligation: EhdsObligation; 
  selectedCountry: string;
  canEdit: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { evidence } = useObligationEvidence(
    selectedCountry !== "all" ? selectedCountry : undefined, 
    obligation.id
  );
  
  const evidenceCount = evidence.length;

  // Only show evidence panel when a specific country is selected
  const showEvidencePanel = selectedCountry !== "all";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border hover:bg-muted/50 transition-colors overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 text-left flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-2">
                {obligation.name}
                {showEvidencePanel && evidenceCount > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Paperclip className="h-2.5 w-2.5" />
                    {evidenceCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{obligation.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1 flex-wrap justify-end">
                {obligation.article_references.map(ref => (
                  <Badge key={ref} variant="secondary" className="text-[10px]">{ref}</Badge>
                ))}
              </div>
              {showEvidencePanel && (
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        
        {showEvidencePanel && (
          <CollapsibleContent>
            <div className="px-3 pb-3 border-t bg-muted/30">
              <div className="pt-3">
                <ObligationEvidenceManager
                  countryCode={selectedCountry}
                  obligationId={obligation.id}
                  obligationName={obligation.name}
                  canEdit={canEdit}
                />
              </div>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
};

export const ImplementationTimelineTracker = ({ 
  showKeyDates = true, 
  keyDates = [] 
}: ImplementationTimelineTrackerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<ObligationCategory | "all">("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<"obligations" | "progress" | "checklist">("obligations");
  const isMobile = useIsMobile();
  
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { myAssignedCountries } = useCountryAssignments();

  const { data: obligations, isLoading: obligationsLoading } = useEhdsObligations();
  const { data: countryStatuses, isLoading: statusesLoading } = useCountryObligationStatuses();
  const { config, isLoading: configLoading } = useImplementationTrackerConfig();

  const isLoading = obligationsLoading || statusesLoading || configLoading;

  // Group obligations by category
  const obligationsByCategory = useMemo(() => {
    if (!obligations) return {};
    return obligations.reduce((acc, ob) => {
      if (!acc[ob.category]) acc[ob.category] = [];
      acc[ob.category].push(ob);
      return acc;
    }, {} as Record<ObligationCategory, EhdsObligation[]>);
  }, [obligations]);

  // Calculate country progress
  const countryProgress = useMemo((): CountryProgress[] => {
    if (!obligations || !config) return [];

    return EU_COUNTRIES.map(country => {
      const countryStatusMap = (countryStatuses || [])
        .filter(s => s.country_code === country.code)
        .reduce((acc, s) => {
          acc[s.obligation_id] = s.status;
          return acc;
        }, {} as Record<string, ObligationStatus>);

      const getStatusValue = (status: ObligationStatus): number => {
        switch (status) {
          case 'completed': return config.status_completed_value;
          case 'partial': return config.status_partial_value;
          case 'in_progress': return config.status_in_progress_value;
          default: return config.status_not_started_value;
        }
      };

      const calculateCategoryProgress = (category: ObligationCategory): number => {
        const categoryObs = obligationsByCategory[category] || [];
        if (categoryObs.length === 0) return 0;
        const total = categoryObs.reduce((sum, ob) => {
          const status = countryStatusMap[ob.id] || 'not_started';
          return sum + getStatusValue(status);
        }, 0);
        return total / categoryObs.length;
      };

      const primaryUseProgress = calculateCategoryProgress('primary_use');
      const secondaryUseProgress = calculateCategoryProgress('secondary_use');
      const generalProgress = calculateCategoryProgress('general');

      const overallProgress = Math.round(
        (primaryUseProgress * config.primary_use_weight / 100) +
        (secondaryUseProgress * config.secondary_use_weight / 100) +
        (generalProgress * config.general_weight / 100)
      );

      const completedCount = Object.values(countryStatusMap).filter(s => s === 'completed').length;

      return {
        countryCode: country.code,
        countryName: country.name,
        primaryUseProgress,
        secondaryUseProgress,
        generalProgress,
        overallProgress,
        completedObligations: completedCount,
        totalObligations: obligations.length,
        obligationStatuses: countryStatusMap,
      };
    });
  }, [obligations, countryStatuses, config, obligationsByCategory]);

  // Filter obligations
  const filteredObligations = useMemo(() => {
    if (!obligations) return [];
    if (selectedCategory === "all") return obligations;
    return obligations.filter(ob => ob.category === selectedCategory);
  }, [obligations, selectedCategory]);

  // Filter country progress
  const filteredCountryProgress = useMemo(() => {
    if (selectedCountry === "all") return countryProgress;
    return countryProgress.filter(c => c.countryCode === selectedCountry);
  }, [countryProgress, selectedCountry]);

  // Export functions
  const exportChecklistJSON = () => {
    const checklist = countryProgress.map(country => ({
      country: country.countryName,
      countryCode: country.countryCode,
      overallProgress: `${country.overallProgress}%`,
      primaryUseProgress: `${Math.round(country.primaryUseProgress)}%`,
      secondaryUseProgress: `${Math.round(country.secondaryUseProgress)}%`,
      generalProgress: `${Math.round(country.generalProgress)}%`,
      completedObligations: country.completedObligations,
      totalObligations: country.totalObligations,
      obligations: obligations?.map(ob => ({
        id: ob.id,
        name: ob.name,
        category: ob.category,
        articleReferences: ob.article_references,
        status: country.obligationStatuses[ob.id] || 'not_started'
      }))
    }));

    const blob = new Blob([JSON.stringify(checklist, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-implementation-checklist.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Checklist exported as JSON!");
  };

  const exportChecklistCSV = () => {
    if (!obligations) return;
    
    // Create headers: Country, Code, Overall, then each obligation name
    const obligationNames = obligations.map(ob => ob.name);
    const headers = ["Country", "Country Code", "Overall Progress (%)", "Primary Use (%)", "Secondary Use (%)", "General (%)", ...obligationNames];
    
    const rows = countryProgress.map(country => {
      const baseData = [
        country.countryName,
        country.countryCode,
        country.overallProgress,
        Math.round(country.primaryUseProgress),
        Math.round(country.secondaryUseProgress),
        Math.round(country.generalProgress),
      ];
      
      const obligationStatuses = obligations.map(ob => 
        STATUS_LABELS[country.obligationStatuses[ob.id] || 'not_started']
      );
      
      return [...baseData, ...obligationStatuses];
    });
    
    const escapeCSV = (value: string | number) => {
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-implementation-checklist.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Checklist exported as CSV!");
  };

  const exportSummaryCSV = () => {
    const headers = ["Country", "Country Code", "Overall Progress", "Primary Use", "Secondary Use", "General", "Completed", "Total"];
    const rows = countryProgress.map(c => [
      c.countryName,
      c.countryCode,
      `${c.overallProgress}%`,
      `${Math.round(c.primaryUseProgress)}%`,
      `${Math.round(c.secondaryUseProgress)}%`,
      `${Math.round(c.generalProgress)}%`,
      c.completedObligations,
      c.totalObligations
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-implementation-summary.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Summary exported to CSV!");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Calculate EU-wide stats
  const totalCountries = EU_COUNTRIES.length;
  const avgProgress = Math.round(countryProgress.reduce((sum, c) => sum + c.overallProgress, 0) / totalCountries);
  const totalObligations = obligations?.length || 0;
  const avgCompleted = Math.round(countryProgress.reduce((sum, c) => sum + c.completedObligations, 0) / totalCountries);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-4">
            <div className="text-xl md:text-2xl font-bold">{avgProgress}%</div>
            <p className="text-xs md:text-sm text-muted-foreground">EU Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-4">
            <div className="text-xl md:text-2xl font-bold">{totalObligations}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Obligations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-4">
            <div className="text-xl md:text-2xl font-bold">{avgCompleted}/{totalObligations}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Avg Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-4">
            <div className="text-xl md:text-2xl font-bold">{totalCountries}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Member States</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>All Categories</span>
                </div>
              </SelectItem>
              {(['primary_use', 'secondary_use', 'general'] as ObligationCategory[]).map(cat => (
                <SelectItem key={cat} value={cat}>
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[cat]}
                    <span>{CATEGORY_LABELS[cat]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {EU_COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {getFlagEmoji(country.code)} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {!isMobile && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                disabled={zoomLevel <= 1}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[2.5rem] text-center">{zoomLevel}x</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 4))}
                disabled={zoomLevel >= 4}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoomLevel(1)}
                className="h-8 px-2 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden lg:inline">Reset</span>
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
              <DropdownMenuItem onClick={exportSummaryCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Summary (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChecklistCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Full Checklist (.csv)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportChecklistJSON} className="gap-2 cursor-pointer">
                <Calendar className="h-4 w-4" />
                Full Checklist (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="obligations" className="text-xs sm:text-sm px-2">
            <span className="hidden sm:inline">Obligations</span>
            <span className="sm:hidden">Oblig.</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs sm:text-sm px-2">
            <span className="hidden sm:inline">Country Progress</span>
            <span className="sm:hidden">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs sm:text-sm px-2">
            Checklist
          </TabsTrigger>
        </TabsList>

        {/* Obligations View */}
        <TabsContent value="obligations" className="mt-3 md:mt-4">
          {selectedCountry !== "all" && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click an obligation to view or add evidence for <strong>{EU_COUNTRIES.find(c => c.code === selectedCountry)?.name}</strong>
              </span>
            </div>
          )}
          <div className="space-y-4">
            {(['primary_use', 'secondary_use', 'general'] as ObligationCategory[])
              .filter(cat => selectedCategory === 'all' || selectedCategory === cat)
              .map(category => (
                <Card key={category}>
                  <CardHeader className="p-3 md:p-4 pb-2">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category]}`} />
                      {CATEGORY_LABELS[category]}
                      <Badge variant="outline" className="ml-2">
                        {obligationsByCategory[category]?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0">
                    <div className="space-y-2">
                      {obligationsByCategory[category]?.map(ob => (
                        <ObligationCard
                          key={ob.id}
                          obligation={ob}
                          selectedCountry={selectedCountry}
                          canEdit={isAdmin || isSuperAdmin || myAssignedCountries.includes(selectedCountry)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Country Progress View */}
        <TabsContent value="progress" className="mt-3 md:mt-4">
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCountryProgress.map(country => (
              <Card key={country.countryCode} className="overflow-hidden">
                <CardHeader className="p-3 md:p-4 pb-2">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <span className="text-xl md:text-2xl">{getFlagEmoji(country.countryCode)}</span>
                    {country.countryName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0 space-y-3 md:space-y-4">
                  <div>
                    <div className="flex justify-between text-xs md:text-sm mb-1">
                      <span>Overall Progress</span>
                      <span className="font-medium">{country.overallProgress}%</span>
                    </div>
                    <Progress value={country.overallProgress} className="h-2" />
                  </div>

                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-chart-1" />
                        <span className="text-muted-foreground">Primary Use</span>
                      </div>
                      <span>{Math.round(country.primaryUseProgress)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-chart-2" />
                        <span className="text-muted-foreground">Secondary Use</span>
                      </div>
                      <span>{Math.round(country.secondaryUseProgress)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-chart-4" />
                        <span className="text-muted-foreground">General</span>
                      </div>
                      <span>{Math.round(country.generalProgress)}%</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {country.completedObligations}/{country.totalObligations} obligations completed
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Checklist View */}
        <TabsContent value="checklist" className="mt-3 md:mt-4">
          <Card>
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-base md:text-lg">Implementation Checklist</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-popover">
                    <DropdownMenuItem onClick={exportChecklistCSV} className="gap-2 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportChecklistJSON} className="gap-2 cursor-pointer">
                      <Calendar className="h-4 w-4" />
                      JSON (.json)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              {/* Mobile: Card layout */}
              <div className="md:hidden space-y-3">
                {filteredCountryProgress.map(country => (
                  <div key={country.countryCode} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getFlagEmoji(country.countryCode)}</span>
                        <span className="font-medium text-sm">{country.countryName}</span>
                      </div>
                      <span className="text-sm font-medium">{country.overallProgress}%</span>
                    </div>
                    <Progress value={country.overallProgress} className="h-1.5 mb-2" />
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-chart-1" />
                        <span>{Math.round(country.primaryUseProgress)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-chart-2" />
                        <span>{Math.round(country.secondaryUseProgress)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-chart-4" />
                        <span>{Math.round(country.generalProgress)}%</span>
                      </div>
                      <span className="text-muted-foreground ml-auto">
                        {country.completedObligations}/{country.totalObligations}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Country</th>
                      <th className="text-left px-4 py-3 font-medium">Primary Use</th>
                      <th className="text-left px-4 py-3 font-medium">Secondary Use</th>
                      <th className="text-left px-4 py-3 font-medium">General</th>
                      <th className="text-left px-4 py-3 font-medium">Completed</th>
                      <th className="text-left px-4 py-3 font-medium">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountryProgress.map(country => (
                      <tr key={country.countryCode} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{getFlagEmoji(country.countryCode)}</span>
                            <span className="font-medium">{country.countryName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{Math.round(country.primaryUseProgress)}%</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{Math.round(country.secondaryUseProgress)}%</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{Math.round(country.generalProgress)}%</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {country.completedObligations}/{country.totalObligations}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={country.overallProgress} className="h-2 w-20" />
                            <span className="text-muted-foreground">{country.overallProgress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-2 md:gap-4">
        {(['primary_use', 'secondary_use', 'general'] as ObligationCategory[]).map(cat => (
          <div key={cat} className="flex items-center gap-1 md:gap-2">
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${CATEGORY_COLORS[cat]}`} />
            <span className="text-xs md:text-sm text-muted-foreground">{CATEGORY_LABELS[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
