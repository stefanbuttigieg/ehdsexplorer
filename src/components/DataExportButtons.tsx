import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface DataExportButtonsProps {
  data: any[];
  filename: string;
  label?: string;
}

export const DataExportButtons = ({
  data,
  filename,
  label = "Export",
}: DataExportButtonsProps) => {
  const { toast } = useToast();

  const exportAsJson = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    downloadBlob(blob, `${filename}.json`);
    toast({ title: "Exported", description: `Downloaded ${filename}.json` });
  };

  const exportAsCsv = () => {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "string") {
              return `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;
            }
            if (Array.isArray(value)) {
              return `"${value.join("; ")}"`;
            }
            return String(value);
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
    toast({ title: "Exported", description: `Downloaded ${filename}.csv` });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={exportAsJson} className="gap-2 cursor-pointer">
          <FileJson className="h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCsv} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
