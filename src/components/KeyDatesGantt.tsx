import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Calendar, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface KeyDate {
  label: string;
  date: string;
}

interface KeyDatesGanttProps {
  dates: KeyDate[];
}

const parseDate = (dateStr: string): Date => {
  // Parse dates like "25 March 2025"
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

  // Sort dates and calculate timeline range
  const sortedDates = [...dates].map(d => ({
    ...d,
    parsed: parseDate(d.date)
  })).sort((a, b) => a.parsed.getTime() - b.parsed.getTime());

  const minDate = sortedDates[0]?.parsed || new Date();
  const maxDate = sortedDates[sortedDates.length - 1]?.parsed || new Date();
  const totalRange = maxDate.getTime() - minDate.getTime();

  // Add some padding to the range
  const paddedMin = new Date(minDate.getTime() - totalRange * 0.05);
  const paddedMax = new Date(maxDate.getTime() + totalRange * 0.05);
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

  // Color palette for milestones
  const colors = [
    "bg-primary",
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4"
  ];

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div className="flex justify-end">
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

      {/* Gantt Chart */}
      <div className="relative">
        {/* Year markers */}
        <div className="relative h-6 border-b border-border mb-2">
          {yearMarkers.map(({ year, position }) => (
            <div 
              key={year}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              {year}
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div className="relative h-2 bg-muted rounded-full mb-6">
          {/* Date markers on track */}
          {sortedDates.map((item, index) => (
            <div
              key={index}
              className={`absolute w-3 h-3 rounded-full -top-0.5 transform -translate-x-1/2 transition-all duration-200 cursor-pointer ${colors[index % colors.length]} ${hoveredIndex === index ? 'scale-150 ring-2 ring-primary/50' : ''}`}
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
                    {/* Bar from start to milestone */}
                    <div 
                      className={`absolute h-full rounded-r-lg transition-all duration-300 ${colors[index % colors.length]} ${isHovered ? 'opacity-100' : 'opacity-70'}`}
                      style={{ 
                        left: 0, 
                        width: `${position}%`,
                        minWidth: '60px'
                      }}
                    />
                    {/* Label */}
                    <div 
                      className={`absolute inset-y-0 flex items-center px-3 text-sm font-medium transition-all duration-200 ${isHovered ? 'text-primary-foreground' : 'text-primary-foreground/90'}`}
                      style={{ left: '8px', maxWidth: `calc(${position}% - 16px)` }}
                    >
                      <span className="truncate">{item.label}</span>
                    </div>
                    {/* Date badge */}
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 bg-background border border-border px-2 py-1 rounded text-xs font-medium shadow-sm transition-all duration-200 ${isHovered ? 'scale-105' : ''}`}
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
        {sortedDates.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
            <span className={hoveredIndex === index ? 'font-medium' : ''}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
