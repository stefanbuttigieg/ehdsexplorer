import { useState, useMemo } from "react";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublishedFaqDataTables, useFaqDataColumns, useFaqDataRows, type FaqDataTable, type FaqDataColumn, type FaqDataRow } from "@/hooks/useFaqDataTables";

function SingleTableDisplay({ table }: { table: FaqDataTable }) {
  const { data: columns = [] } = useFaqDataColumns(table.id);
  const { data: rows = [] } = useFaqDataRows(table.id);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      Object.values(r.values).some(v => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const exportCsv = () => {
    if (columns.length === 0) return;
    const header = columns.map(c => `"${c.name}"`).join(",");
    const csvRows = filtered.map(r =>
      columns.map(c => `"${(r.values[c.column_key] || "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table.name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">{table.name}</h4>
          {table.description && <p className="text-xs text-muted-foreground">{table.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search table..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 h-7 text-xs w-40"
            />
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={exportCsv}>
            <Download className="h-3 w-3 mr-1" /> CSV
          </Button>
        </div>
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
            {filtered.map(row => (
              <TableRow key={row.id}>
                {columns.map(col => (
                  <TableCell key={col.id} className="text-xs">{row.values[col.column_key] || ""}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {rows.length} rows</p>
    </div>
  );
}

export function FaqDataTableDisplay({ faqId }: { faqId: string }) {
  const { data: tables = [] } = usePublishedFaqDataTables(faqId);

  if (tables.length === 0) return null;

  return (
    <div className="space-y-4">
      {tables.map(table => (
        <SingleTableDisplay key={table.id} table={table} />
      ))}
    </div>
  );
}
