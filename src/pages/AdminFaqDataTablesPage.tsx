import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Table as TableIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useAllEhdsFaqs } from "@/hooks/useEhdsFaqs";
import {
  useFaqDataTables, useFaqDataColumns, useFaqDataRows,
  useFaqDataTableMutations, useFaqDataColumnMutations, useFaqDataRowMutations,
  type FaqDataTable, type FaqDataColumn, type FaqDataRow,
} from "@/hooks/useFaqDataTables";
import { useToast } from "@/hooks/use-toast";

function TableEditor({ table, faqId }: { table: FaqDataTable; faqId: string }) {
  const { data: columns = [] } = useFaqDataColumns(table.id);
  const { data: rows = [] } = useFaqDataRows(table.id);
  const { createColumn, updateColumn, deleteColumn } = useFaqDataColumnMutations(table.id);
  const { createRow, updateRow, deleteRow } = useFaqDataRowMutations(table.id);
  const { updateTable, deleteTable } = useFaqDataTableMutations(faqId);
  const { toast } = useToast();

  const [newColName, setNewColName] = useState("");
  const [editingRow, setEditingRow] = useState<FaqDataRow | null>(null);
  const [rowValues, setRowValues] = useState<Record<string, string>>({});

  const addColumn = () => {
    if (!newColName.trim()) return;
    const key = newColName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    createColumn.mutate({ name: newColName.trim(), column_key: key, sort_order: columns.length }, {
      onSuccess: () => { setNewColName(""); toast({ title: "Column added" }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const addRow = () => {
    const vals: Record<string, string> = {};
    columns.forEach(c => { vals[c.column_key] = ""; });
    createRow.mutate({ values: vals, sort_order: rows.length }, {
      onSuccess: () => toast({ title: "Row added" }),
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  const startEditRow = (row: FaqDataRow) => {
    setEditingRow(row);
    setRowValues({ ...row.values });
  };

  const saveRow = () => {
    if (!editingRow) return;
    updateRow.mutate({ id: editingRow.id, values: rowValues }, {
      onSuccess: () => { setEditingRow(null); toast({ title: "Row updated" }); },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{table.name}</CardTitle>
            <Badge variant={table.is_published ? "default" : "secondary"} className="text-xs">
              {table.is_published ? "Published" : "Draft"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={table.is_published}
              onCheckedChange={(val) => updateTable.mutate({ id: table.id, is_published: val })}
            />
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-destructive"
              onClick={() => deleteTable.mutate(table.id, {
                onSuccess: () => toast({ title: "Table deleted" }),
              })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {table.description && <p className="text-xs text-muted-foreground mt-1">{table.description}</p>}
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">Add Column</Label>
            <Input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Column name" className="h-8 text-sm" />
          </div>
          <Button size="sm" className="h-8" onClick={addColumn} disabled={!newColName.trim()}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {columns.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {columns.map(col => (
              <Badge key={col.id} variant="outline" className="text-xs gap-1">
                {col.name}
                <button
                  className="ml-1 text-destructive hover:text-destructive/80"
                  onClick={() => deleteColumn.mutate(col.id, {
                    onSuccess: () => toast({ title: "Column removed" }),
                  })}
                >×</button>
              </Badge>
            ))}
          </div>
        )}

        {columns.length > 0 && (
          <>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(c => <TableHead key={c.id} className="text-xs">{c.name}</TableHead>)}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id}>
                      {columns.map(c => (
                        <TableCell key={c.id} className="text-xs max-w-[200px] truncate">
                          {row.values[c.column_key] || "—"}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditRow(row)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteRow.mutate(row.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-3 w-3 mr-1" /> Add Row
            </Button>
          </>
        )}

        <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Row</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {columns.map(col => (
                <div key={col.id}>
                  <Label className="text-xs">{col.name}</Label>
                  <Textarea
                    value={rowValues[col.column_key] || ""}
                    onChange={e => setRowValues(p => ({ ...p, [col.column_key]: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingRow(null)}>Cancel</Button>
              <Button onClick={saveRow}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

const AdminFaqDataTablesPage = () => {
  const [searchParams] = useSearchParams();
  const faqId = searchParams.get("faq") || "";
  const { data: faqs = [] } = useAllEhdsFaqs();
  const { data: tables = [] } = useFaqDataTables(faqId);
  const { createTable } = useFaqDataTableMutations(faqId);
  const { toast } = useToast();

  const [selectedFaq, setSelectedFaq] = useState(faqId);
  const [newTableName, setNewTableName] = useState("");
  const [newTableDesc, setNewTableDesc] = useState("");

  const currentFaq = faqs.find(f => f.id === selectedFaq);

  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    createTable.mutate({ name: newTableName.trim(), description: newTableDesc.trim() || undefined }, {
      onSuccess: () => {
        setNewTableName("");
        setNewTableDesc("");
        toast({ title: "Table created" });
      },
      onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <AdminPageLayout
      title="FAQ Data Tables"
      description="Manage structured data tables attached to EHDS FAQs"
    >
      <div className="space-y-4">
        <div className="max-w-md">
          <Label>Select FAQ</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedFaq}
            onChange={e => setSelectedFaq(e.target.value)}
          >
            <option value="">— Select a FAQ —</option>
            {faqs.map(f => (
              <option key={f.id} value={f.id}>#{f.faq_number} — {f.question.slice(0, 80)}</option>
            ))}
          </select>
        </div>

        {selectedFaq && (
          <>
            {currentFaq && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium">FAQ #{currentFaq.faq_number}: {currentFaq.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">{currentFaq.chapter}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">Add Data Table</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <Input
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  placeholder="Table name"
                />
                <Input
                  value={newTableDesc}
                  onChange={e => setNewTableDesc(e.target.value)}
                  placeholder="Description (optional)"
                />
                <Button size="sm" onClick={handleCreateTable} disabled={!newTableName.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Create Table
                </Button>
              </CardContent>
            </Card>

            {tables.map(table => (
              <TableEditor key={table.id} table={table} faqId={selectedFaq} />
            ))}

            {tables.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No data tables for this FAQ yet.</p>
            )}
          </>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AdminFaqDataTablesPage;
