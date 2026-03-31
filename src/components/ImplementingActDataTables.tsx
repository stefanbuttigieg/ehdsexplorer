import { useState, useMemo } from "react";
import { Search, Download, Table2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedDataTables, useDataColumns, useDataRows, type DataTable, type DataColumn, type DataRow } from "@/hooks/useImplementingActDataTables";
import { cn } from "@/lib/utils";

function DataTableView({ table }: { table: DataTable }) {
  const { data: columns = [], isLoading: colsLoading } = useDataColumns(table.id);
  const { data: rows = [], isLoading: rowsLoading } = useDataRows(table.id);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(row =>
      Object.values(row.values).some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const exportCSV = () => {
    if (columns.length === 0) return;
    const header = columns.map(c => `"${c.name}"`).join(",");
    const body = filtered.map(row =>
      columns.map(c => `"${(row.values[c.column_key] || "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = colsLoading || rowsLoading;

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (columns.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-left group">
                <Table2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <CardTitle className="text-base">{table.name}</CardTitle>
                  {table.description && (
                    <CardDescription className="text-xs mt-0.5">{table.description}</CardDescription>
                  )}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform ml-2", isOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <Badge variant="outline" className="shrink-0">{rows.length} rows</Badge>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search data elements..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} className="shrink-0">
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(col => (
                      <TableHead key={col.id} className="text-xs whitespace-nowrap">{col.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-muted-foreground text-sm py-6">
                        {search ? "No matching rows." : "No data rows yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(row => (
                      <TableRow key={row.id}>
                        {columns.map(col => (
                          <TableCell key={col.id} className="text-sm max-w-xs">
                            <span className="line-clamp-3">{row.values[col.column_key] || ""}</span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {search && filtered.length !== rows.length && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing {filtered.length} of {rows.length} rows
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function ImplementingActDataTables({ implementingActId }: { implementingActId: string }) {
  const { data: tables = [], isLoading } = usePublishedDataTables(implementingActId);

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (tables.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Table2 className="h-5 w-5 text-primary" />
        Data Tables
      </h2>
      {tables.map(table => (
        <DataTableView key={table.id} table={table} />
      ))}
    </div>
  );
}
