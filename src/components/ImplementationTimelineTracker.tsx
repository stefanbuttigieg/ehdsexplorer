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
  Download, 
  Calendar, 
  FileSpreadsheet, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Filter,
  Building2,
  FileCheck,
  Scale,
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useHealthAuthorities, type AuthorityStatus } from "@/hooks/useHealthAuthorities";
import { useCountryLegislation, type CountryLegislation } from "@/hooks/useCountryLegislation";
import { Skeleton } from "@/components/ui/skeleton";

// Milestone types for filtering
export type MilestoneType = 
  | "all"
  | "dha_designation"
  | "hdab_setup"
  | "ehr_certification"
  | "legislation_adoption"
  | "cross_border";

interface MilestoneConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const milestoneTypeConfig: Record<MilestoneType, MilestoneConfig> = {
  all: { label: "All Milestones", icon: <Filter className="h-4 w-4" />, color: "bg-primary" },
  dha_designation: { label: "DHA Designation", icon: <Building2 className="h-4 w-4" />, color: "bg-chart-1" },
  hdab_setup: { label: "HDAB Setup", icon: <Building2 className="h-4 w-4" />, color: "bg-chart-2" },
  ehr_certification: { label: "EHR Certification", icon: <FileCheck className="h-4 w-4" />, color: "bg-chart-3" },
  legislation_adoption: { label: "Legislation Adoption", icon: <Scale className="h-4 w-4" />, color: "bg-chart-4" },
  cross_border: { label: "Cross-Border Infrastructure", icon: <Globe className="h-4 w-4" />, color: "bg-chart-5" },
};

interface CountryProgress {
  countryCode: string;
  countryName: string;
  dhaStatus: AuthorityStatus | null;
  hdabStatus: AuthorityStatus | null;
  legislationCount: number;
  adoptedLegislationCount: number;
  progressPercent: number;
  milestones: CountryMilestone[];
}

interface CountryMilestone {
  type: MilestoneType;
  label: string;
  date: Date | null;
  status: "completed" | "in_progress" | "pending";
  countryCode: string;
  countryName: string;
}

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

const statusToProgress = (status: AuthorityStatus | null): number => {
  switch (status) {
    case "active": return 100;
    case "pending": return 50;
    case "planned": return 25;
    case "inactive": return 0;
    default: return 0;
  }
};

const getStatusIcon = (status: "completed" | "in_progress" | "pending") => {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-chart-2" />;
    case "in_progress": return <Clock className="h-4 w-4 text-chart-4" />;
    case "pending": return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatDateForICS = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

interface ImplementationTimelineTrackerProps {
  showKeyDates?: boolean;
  keyDates?: Array<{ label: string; date: string; category?: string }>;
}

export const ImplementationTimelineTracker = ({ 
  showKeyDates = true, 
  keyDates = [] 
}: ImplementationTimelineTrackerProps) => {
  const [selectedMilestoneType, setSelectedMilestoneType] = useState<MilestoneType>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<"timeline" | "progress" | "checklist">("timeline");

  const { authorities, isLoading: authoritiesLoading } = useHealthAuthorities();
  const { data: legislation, isLoading: legislationLoading } = useCountryLegislation();

  const isLoading = authoritiesLoading || legislationLoading;

  // Calculate country progress data
  const countryProgress = useMemo((): CountryProgress[] => {
    return EU_COUNTRIES.map(country => {
      const countryAuthorities = authorities?.filter(a => a.country_code === country.code) || [];
      const countryLegislation = legislation?.filter(l => l.country_code === country.code) || [];
      
      const dha = countryAuthorities.find(a => a.authority_type === "digital_health_authority");
      const hdab = countryAuthorities.find(a => a.authority_type === "health_data_access_body");
      
      const adoptedLegislation = countryLegislation.filter(l => 
        l.status === "adopted" || l.status === "in_force"
      );

      // Build milestones
      const milestones: CountryMilestone[] = [];

      // DHA milestone
      if (dha) {
        milestones.push({
          type: "dha_designation",
          label: `${dha.name} designated`,
          date: dha.created_at ? new Date(dha.created_at) : null,
          status: dha.status === "active" ? "completed" : dha.status === "pending" ? "in_progress" : "pending",
          countryCode: country.code,
          countryName: country.name,
        });
      }

      // HDAB milestone
      if (hdab) {
        milestones.push({
          type: "hdab_setup",
          label: `${hdab.name} established`,
          date: hdab.created_at ? new Date(hdab.created_at) : null,
          status: hdab.status === "active" ? "completed" : hdab.status === "pending" ? "in_progress" : "pending",
          countryCode: country.code,
          countryName: country.name,
        });
      }

      // Legislation milestones
      countryLegislation.forEach(leg => {
        const effectiveDate = leg.effective_date ? new Date(leg.effective_date) : 
                             leg.adoption_date ? new Date(leg.adoption_date) : null;
        milestones.push({
          type: "legislation_adoption",
          label: leg.title,
          date: effectiveDate,
          status: leg.status === "in_force" ? "completed" : 
                  leg.status === "adopted" ? "in_progress" : "pending",
          countryCode: country.code,
          countryName: country.name,
        });
      });

      // Calculate overall progress
      const dhaProgress = statusToProgress(dha?.status || null);
      const hdabProgress = statusToProgress(hdab?.status || null);
      const legProgress = countryLegislation.length > 0 
        ? (adoptedLegislation.length / countryLegislation.length) * 100 
        : 0;
      
      const overallProgress = Math.round((dhaProgress + hdabProgress + legProgress) / 3);

      return {
        countryCode: country.code,
        countryName: country.name,
        dhaStatus: dha?.status || null,
        hdabStatus: hdab?.status || null,
        legislationCount: countryLegislation.length,
        adoptedLegislationCount: adoptedLegislation.length,
        progressPercent: overallProgress,
        milestones,
      };
    });
  }, [authorities, legislation]);

  // Filter milestones based on selection
  const filteredMilestones = useMemo(() => {
    let allMilestones = countryProgress.flatMap(c => c.milestones);
    
    if (selectedMilestoneType !== "all") {
      allMilestones = allMilestones.filter(m => m.type === selectedMilestoneType);
    }
    
    if (selectedCountry !== "all") {
      allMilestones = allMilestones.filter(m => m.countryCode === selectedCountry);
    }

    return allMilestones.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }, [countryProgress, selectedMilestoneType, selectedCountry]);

  // Filter country progress
  const filteredCountryProgress = useMemo(() => {
    if (selectedCountry === "all") return countryProgress;
    return countryProgress.filter(c => c.countryCode === selectedCountry);
  }, [countryProgress, selectedCountry]);

  // Export functions
  const exportChecklist = () => {
    const checklist = countryProgress.map(country => ({
      country: country.countryName,
      countryCode: country.countryCode,
      overallProgress: `${country.progressPercent}%`,
      digitalHealthAuthority: {
        status: country.dhaStatus || "not_started",
        progress: `${statusToProgress(country.dhaStatus)}%`
      },
      healthDataAccessBody: {
        status: country.hdabStatus || "not_started",
        progress: `${statusToProgress(country.hdabStatus)}%`
      },
      legislation: {
        total: country.legislationCount,
        adopted: country.adoptedLegislationCount
      },
      milestones: country.milestones.map(m => ({
        type: milestoneTypeConfig[m.type]?.label || m.type,
        label: m.label,
        date: m.date?.toISOString().split('T')[0] || "TBD",
        status: m.status
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
    toast.success("Implementation checklist exported!");
  };

  const exportToCSV = () => {
    const headers = ["Country", "Country Code", "Milestone Type", "Milestone", "Date", "Status"];
    const rows = filteredMilestones.map(m => [
      m.countryName,
      m.countryCode,
      milestoneTypeConfig[m.type]?.label || m.type,
      m.label,
      m.date?.toISOString().split('T')[0] || "TBD",
      m.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-implementation-milestones.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Milestones exported to CSV!");
  };

  const exportToICS = () => {
    const events = filteredMilestones
      .filter(m => m.date)
      .map((m, index) => {
        const dateStr = formatDateForICS(m.date!);
        const nextDay = new Date(m.date!);
        nextDay.setDate(nextDay.getDate() + 1);
        const endDateStr = formatDateForICS(nextDay);
        
        return `BEGIN:VEVENT
UID:ehds-impl-${m.countryCode}-${index}@ehdsexplorer.app
DTSTAMP:${formatDateForICS(new Date())}T000000Z
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${endDateStr}
SUMMARY:${m.countryName}: ${m.label}
DESCRIPTION:EHDS Implementation - ${milestoneTypeConfig[m.type]?.label || m.type}
END:VEVENT`;
      }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EHDS Explorer//Implementation Timeline//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:EHDS Implementation Timeline
${events}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-implementation-timeline.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded!");
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
  const countriesWithDHA = countryProgress.filter(c => c.dhaStatus === "active").length;
  const countriesWithHDAB = countryProgress.filter(c => c.hdabStatus === "active").length;
  const avgProgress = Math.round(countryProgress.reduce((sum, c) => sum + c.progressPercent, 0) / totalCountries);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <p className="text-sm text-muted-foreground">EU Average Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{countriesWithDHA}/{totalCountries}</div>
            <p className="text-sm text-muted-foreground">Active DHAs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{countriesWithHDAB}/{totalCountries}</div>
            <p className="text-sm text-muted-foreground">Active HDABs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{filteredMilestones.length}</div>
            <p className="text-sm text-muted-foreground">Total Milestones</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedMilestoneType} onValueChange={(v) => setSelectedMilestoneType(v as MilestoneType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by milestone type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(milestoneTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {config.icon}
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by country" />
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

        <div className="flex gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
              disabled={zoomLevel <= 1}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[3rem] text-center">{zoomLevel}x</span>
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
              Reset
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToICS} className="gap-2 cursor-pointer">
                <Calendar className="h-4 w-4" />
                Calendar (.ics)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Milestones (.csv)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportChecklist} className="gap-2 cursor-pointer">
                <FileCheck className="h-4 w-4" />
                Full Checklist (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="progress">Country Progress</TabsTrigger>
          <TabsTrigger value="checklist">Implementation Checklist</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {filteredMilestones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No milestones found for the selected filters.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <div style={{ width: `${100 * zoomLevel}%`, minWidth: '100%' }}>
                    {/* Milestone list */}
                    <div className="space-y-3">
                      {filteredMilestones.slice(0, 20).map((milestone, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex-shrink-0 w-10 text-center">
                                {getFlagEmoji(milestone.countryCode)}
                              </div>
                              <div className="flex-shrink-0">
                                {getStatusIcon(milestone.status)}
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="font-medium truncate">{milestone.label}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {milestoneTypeConfig[milestone.type]?.label}
                                  </Badge>
                                  <span>{milestone.countryName}</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-sm text-muted-foreground">
                                {milestone.date?.toLocaleDateString() || "TBD"}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{milestone.label}</p>
                            <p>{milestone.countryName} • {milestone.status}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {filteredMilestones.length > 20 && (
                        <p className="text-center text-muted-foreground py-2">
                          ... and {filteredMilestones.length - 20} more milestones
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Country Progress View */}
        <TabsContent value="progress" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCountryProgress.map(country => (
              <Card key={country.countryCode} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{getFlagEmoji(country.countryCode)}</span>
                    {country.countryName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span className="font-medium">{country.progressPercent}%</span>
                    </div>
                    <Progress value={country.progressPercent} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>DHA:</span>
                      <Badge variant={country.dhaStatus === "active" ? "default" : "secondary"} className="text-xs">
                        {country.dhaStatus || "None"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>HDAB:</span>
                      <Badge variant={country.hdabStatus === "active" ? "default" : "secondary"} className="text-xs">
                        {country.hdabStatus || "None"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span>Legislation: {country.adoptedLegislationCount}/{country.legislationCount} adopted</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {country.milestones.length} total milestones tracked
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Checklist View */}
        <TabsContent value="checklist" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Implementation Checklist</span>
                <Button variant="outline" size="sm" onClick={exportChecklist} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Checklist
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Country</th>
                      <th className="text-left px-4 py-3 font-medium">DHA</th>
                      <th className="text-left px-4 py-3 font-medium">HDAB</th>
                      <th className="text-left px-4 py-3 font-medium">Legislation</th>
                      <th className="text-left px-4 py-3 font-medium">Progress</th>
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
                          <Badge variant={country.dhaStatus === "active" ? "default" : "secondary"}>
                            {country.dhaStatus || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={country.hdabStatus === "active" ? "default" : "secondary"}>
                            {country.hdabStatus || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {country.adoptedLegislationCount}/{country.legislationCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={country.progressPercent} className="h-2 w-20" />
                            <span className="text-muted-foreground">{country.progressPercent}%</span>
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

      {/* Milestone Type Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(milestoneTypeConfig).filter(([key]) => key !== "all").map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
