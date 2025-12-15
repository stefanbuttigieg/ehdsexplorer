import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Calendar, FileSpreadsheet, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type KeyDateCategory = 
  | "general"
  | "primary-use"
  | "ehr-systems"
  | "secondary-use"
  | "cross-border";

interface KeyDate {
  label: string;
  date: string;
  category?: KeyDateCategory;
}

interface KeyDatesGanttProps {
  dates: KeyDate[];
}

const categoryConfig: Record<KeyDateCategory, { label: string; color: string }> = {
  "general": { label: "General", color: "bg-primary" },
  "primary-use": { label: "Primary Use", color: "bg-chart-1" },
  "ehr-systems": { label: "EHR Systems", color: "bg-chart-2" },
  "secondary-use": { label: "Secondary Use", color: "bg-chart-3" },
  "cross-border": { label: "Cross-Border", color: "bg-chart-4" },
};

const getCategoryColor = (category?: KeyDateCategory): string => {
  return category ? categoryConfig[category]?.color || "bg-primary" : "bg-primary";
};

const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split(" ");
  const day = parseInt(parts[0]);
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  const month = monthNames.indexOf(parts[1]);
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
};

const formatDateForICS = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const KeyDatesGantt = ({ dates }: KeyDatesGanttProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sort dates and calculate timeline range
  const sortedDates = [...dates].map(d => ({
    ...d,
    parsed: parseDate(d.date)
  })).sort((a, b) => a.parsed.getTime() - b.parsed.getTime());

  const minDate = sortedDates[0]?.parsed || new Date();
  // Extend to 2040
  const fixedMaxDate = new Date(2040, 11, 31);
  
  // Add some padding to the start
  const paddedMin = new Date(minDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days padding
  const paddedMax = fixedMaxDate;
  const paddedRange = paddedMax.getTime() - paddedMin.getTime();

  const getPosition = (date: Date) => {
    return ((date.getTime() - paddedMin.getTime()) / paddedRange) * 100;
  };

  // Generate year markers
  const startYear = paddedMin.getFullYear();
  const endYear = paddedMax.getFullYear();
  const yearMarkers = [];
  for (let year = startYear; year <= endYear; year++) {
    const yearDate = new Date(year, 0, 1);
    if (yearDate >= paddedMin && yearDate <= paddedMax) {
      yearMarkers.push({ year, position: getPosition(yearDate) });
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  const exportToICS = () => {
    const events = sortedDates.map((item, index) => {
      const dateStr = formatDateForICS(item.parsed);
      const nextDay = new Date(item.parsed);
      nextDay.setDate(nextDay.getDate() + 1);
      const endDateStr = formatDateForICS(nextDay);
      
      return `BEGIN:VEVENT
UID:ehds-date-${index}@ehdsexplorer.app
DTSTAMP:${formatDateForICS(new Date())}T000000Z
DTSTART;VALUE=DATE:${dateStr}
DTEND;VALUE=DATE:${endDateStr}
SUMMARY:EHDS: ${item.label}
DESCRIPTION:European Health Data Space Regulation - ${item.label}
END:VEVENT`;
    }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EHDS Explorer//Key Dates//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:EHDS Key Dates
${events}
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-key-dates.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded! Import it into your calendar app.");
  };

  const exportToCSV = () => {
    const headers = ["Date", "Milestone", "Description"];
    const rows = sortedDates.map(item => [
      item.date,
      item.label,
      `EHDS Regulation - ${item.label}`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-key-dates.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded! Import it into Excel, Asana, Monday.com, etc.");
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify({
      project: "European Health Data Space Regulation",
      milestones: sortedDates.map(item => ({
        name: item.label,
        date: item.parsed.toISOString().split('T')[0],
        displayDate: item.date
      }))
    }, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ehds-key-dates.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON file downloaded!");
  };

  // Category colors are now used instead of cycling colors

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Zoom:</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[3rem] text-center">{zoomLevel}x</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn}
            disabled={zoomLevel >= 4}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleResetZoom}
            className="h-8 px-2 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Dates
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToICS} className="gap-2 cursor-pointer">
              <Calendar className="h-4 w-4" />
              Calendar (.ics) - Google, Outlook, Apple
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4" />
              Spreadsheet (.csv) - Excel, Asana, Monday
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToJSON} className="gap-2 cursor-pointer">
              <Download className="h-4 w-4" />
              JSON - Programmatic use
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Gantt Chart with horizontal scroll */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto border border-border rounded-lg p-4 bg-card"
      >
        <div style={{ width: `${100 * zoomLevel}%`, minWidth: '100%' }}>
          {/* Year markers */}
          <div className="relative h-8 border-b border-border mb-4">
            {yearMarkers.map(({ year, position }) => (
              <div 
                key={year}
                className="absolute text-xs font-medium text-muted-foreground"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                {year}
              </div>
            ))}
          </div>

          {/* Timeline track */}
          <div className="relative h-3 bg-muted rounded-full mb-8">
            {sortedDates.map((item, index) => (
              <div
                key={index}
                className={`absolute w-4 h-4 rounded-full -top-0.5 transform -translate-x-1/2 transition-all duration-200 cursor-pointer border-2 border-background ${getCategoryColor(item.category)} ${hoveredIndex === index ? 'scale-150 ring-2 ring-primary/50' : ''}`}
                style={{ left: `${getPosition(item.parsed)}%` }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </div>

          {/* Milestone bars */}
          <div className="space-y-3">
            {sortedDates.map((item, index) => {
              const position = getPosition(item.parsed);
              const isHovered = hoveredIndex === index;
              
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div 
                      className="relative h-10 group cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div 
                        className={`absolute h-full rounded-r-lg transition-all duration-300 ${getCategoryColor(item.category)} ${isHovered ? 'opacity-100' : 'opacity-70'}`}
                        style={{ 
                          left: 0, 
                          width: `${position}%`,
                          minWidth: '60px'
                        }}
                      />
                      <div 
                        className={`absolute inset-y-0 flex items-center px-3 text-sm font-medium transition-all duration-200 ${isHovered ? 'text-primary-foreground' : 'text-primary-foreground/90'}`}
                        style={{ left: '8px', maxWidth: `calc(${position}% - 16px)` }}
                      >
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 bg-background border border-border px-2 py-1 rounded text-xs font-medium shadow-sm transition-all duration-200 whitespace-nowrap ${isHovered ? 'scale-105' : ''}`}
                        style={{ left: `calc(${position}% + 8px)` }}
                      >
                        {item.date}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-muted-foreground">{item.date}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.entries(categoryConfig).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Legend / Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Milestone</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {sortedDates.map((item, index) => (
              <tr 
                key={index} 
                className={`border-t border-border transition-colors cursor-pointer ${hoveredIndex === index ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getCategoryColor(item.category)}`} />
                    <span>{item.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.category ? categoryConfig[item.category]?.label : 'General'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};