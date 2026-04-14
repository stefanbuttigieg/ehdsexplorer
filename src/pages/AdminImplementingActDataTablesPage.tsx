import { useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ClipboardPaste } from "lucide-react";
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowLeft, Table2, Columns, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import {
  useDataTables, useDataColumns, useDataRows,
  useDataTableMutations, useDataColumnMutations, useDataRowMutations,
  type DataTable, type DataColumn,
} from "@/hooks/useImplementingActDataTables";
import { useToast } from "@/hooks/use-toast";

function TableManager({ actId, actTitle }: { actId: string; actTitle: string }) {
  const { data: tables = [], isLoading } = useDataTables(actId);
  const { createTable, updateTable, deleteTable } = useDataTableMutations(actId);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingTable, setEditingTable] = useState<DataTable | null>(null);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createTable.mutateAsync({ name: newName, description: newDesc });
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      toast({ title: "Table created" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const activeTable = tables.find(t => t.id === activeTableId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-medium text-sm text-muted-foreground">{actTitle}</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No data tables yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {tables.map(t => (
            <Card key={t.id} className={activeTableId === t.id ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <button className="text-left flex-1 min-w-0" onClick={() => setActiveTableId(activeTableId === t.id ? null : t.id)}>
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={t.is_published}
                    onCheckedChange={(v) => updateTable.mutate({ id: t.id, is_published: v })}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTable(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                    if (confirm("Delete this table and all its data?")) deleteTable.mutate(t.id);
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTable && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">{activeTable.name} — Schema & Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="columns">
              <TabsList>
                <TabsTrigger value="columns"><Columns className="h-4 w-4 mr-1" />Columns</TabsTrigger>
                <TabsTrigger value="rows"><Rows3 className="h-4 w-4 mr-1" />Rows</TabsTrigger>
              </TabsList>
              <TabsContent value="columns">
                <ColumnManager tableId={activeTable.id} />
              </TabsContent>
              <TabsContent value="rows">
                <RowManager tableId={activeTable.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Data Table</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Patient Summary Data Elements" /></div>
            <div><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingTable} onOpenChange={() => setEditingTable(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Table</DialogTitle></DialogHeader>
          {editingTable && <EditTableForm table={editingTable} onSave={(name, desc) => {
            updateTable.mutate({ id: editingTable.id, name, description: desc });
            setEditingTable(null);
          }} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTable(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditTableForm({ table, onSave }: { table: DataTable; onSave: (name: string, desc: string) => void }) {
  const [name, setName] = useState(table.name);
  const [desc, setDesc] = useState(table.description || "");
  return (
    <div className="space-y-3">
      <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
      <div><Label>Description</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
      <Button onClick={() => onSave(name, desc)} disabled={!name.trim()}>Save</Button>
    </div>
  );
}

function ColumnManager({ tableId }: { tableId: string }) {
  const { data: columns = [], isLoading } = useDataColumns(tableId);
  const { createColumn, deleteColumn } = useDataColumnMutations(tableId);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");

  const handleAdd = () => {
    if (!newName.trim() || !newKey.trim()) return;
    createColumn.mutate({ name: newName, column_key: newKey, sort_order: columns.length });
    setNewName("");
    setNewKey("");
  };

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-3 mt-3">
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Column name" value={newName} onChange={e => {
          setNewName(e.target.value);
          if (!newKey || newKey === newName.toLowerCase().replace(/\s+/g, "_")) {
            setNewKey(e.target.value.toLowerCase().replace(/\s+/g, "_"));
          }
        }} className="flex-1 min-w-[120px]" />
        <Input placeholder="Key" value={newKey} onChange={e => setNewKey(e.target.value)} className="w-32" />
        <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || !newKey.trim()}>
          <Plus className="h-4 w-4 mr-1" />Add
        </Button>
      </div>
      {columns.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map(col => (
                <TableRow key={col.id}>
                  <TableCell className="text-sm">{col.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{col.column_key}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteColumn.mutate(col.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RowManager({ tableId }: { tableId: string }) {
  const { data: columns = [] } = useDataColumns(tableId);
  const { data: rows = [], isLoading } = useDataRows(tableId);
  const { createRow, updateRow, deleteRow } = useDataRowMutations(tableId);
  const [editingRow, setEditingRow] = useState<{ id: string; values: Record<string, string> } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteHasHeader, setPasteHasHeader] = useState(true);
  const [pastePreview, setPastePreview] = useState<Record<string, string>[]>([]);
  const { toast } = useToast();

  const handleAddRow = () => {
    createRow.mutate({ values: newValues, sort_order: rows.length });
    setNewValues({});
    setShowAdd(false);
  };

  const parsePasteText = useCallback((text: string, hasHeader: boolean) => {
    if (!text.trim()) { setPastePreview([]); return; }
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) { setPastePreview([]); return; }

    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    const parsed = lines.map(line => {
      if (delimiter === ",") {
        const fields: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === "," && !inQuotes) { fields.push(current.trim()); current = ""; }
          else { current += char; }
        }
        fields.push(current.trim());
        return fields;
      }
      return line.split(delimiter).map(f => f.trim());
    });

    let headerKeys: string[];
    let dataRows: string[][];

    if (hasHeader) {
      const headerRow = parsed[0];
      headerKeys = headerRow.map(h => {
        const match = columns.find(c =>
          c.name.toLowerCase() === h.toLowerCase() ||
          c.column_key.toLowerCase() === h.toLowerCase()
        );
        return match ? match.column_key : h.toLowerCase().replace(/\s+/g, "_");
      });
      dataRows = parsed.slice(1);
    } else {
      headerKeys = columns.map(c => c.column_key);
      dataRows = parsed;
    }

    const result = dataRows.map(cells => {
      const values: Record<string, string> = {};
      headerKeys.forEach((key, i) => {
        if (i < cells.length && cells[i]) values[key] = cells[i];
      });
      return values;
    }).filter(v => Object.values(v).some(val => val.trim()));

    setPastePreview(result);
  }, [columns]);

  const handlePasteImport = async () => {
    if (pastePreview.length === 0) return;
    let successCount = 0;
    for (let i = 0; i < pastePreview.length; i++) {
      try {
        await createRow.mutateAsync({ values: pastePreview[i], sort_order: rows.length + i });
        successCount++;
      } catch (e: any) {
        toast({ title: "Error on row " + (i + 1), description: e.message, variant: "destructive" });
      }
    }
    toast({ title: `Imported ${successCount} row${successCount !== 1 ? "s" : ""}` });
    setPasteText("");
    setPastePreview([]);
    setShowPaste(false);
  };

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground mt-3">Add columns first before adding rows.</p>;
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" />Add Row
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowPaste(true)}>
          <ClipboardPaste className="h-4 w-4 mr-1" />Paste from Excel
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(c => <TableHead key={c.id} className="text-xs whitespace-nowrap">{c.name}</TableHead>)}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  {columns.map(c => (
                    <TableCell key={c.id} className="text-sm max-w-xs">
                      <span className="line-clamp-2">{row.values[c.column_key] || ""}</span>
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingRow({ id: row.id, values: { ...row.values } })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRow.mutate(row.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Row Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Row</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {columns.map(c => (
              <div key={c.id}>
                <Label className="text-xs">{c.name}</Label>
                <Input value={newValues[c.column_key] || ""} onChange={e => setNewValues(p => ({ ...p, [c.column_key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddRow}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paste from Excel Dialog */}
      <Dialog open={showPaste} onOpenChange={(v) => { setShowPaste(v); if (!v) { setPasteText(""); setPastePreview([]); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5" />
              Paste from Excel / Spreadsheet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy rows from Excel or Google Sheets and paste below. Supports tab-separated (TSV) and comma-separated (CSV) formats.
            </p>
            <div className="flex items-center gap-2">
              <Switch checked={pasteHasHeader} onCheckedChange={(v) => { setPasteHasHeader(v); parsePasteText(pasteText, v); }} />
              <Label className="text-sm">First row is header</Label>
            </div>
            <div>
              <Label className="text-xs">Pasted data</Label>
              <Textarea
                placeholder={"Paste spreadsheet data here...\ne.g.\nName\tType\tDescription\nPatient ID\tII\tUnique identifier"}
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); parsePasteText(e.target.value, pasteHasHeader); }}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Expected columns: {columns.map(c => c.name).join(", ")}
            </p>
            {pastePreview.length > 0 && (
              <div>
                <Label className="text-xs mb-1 block">Preview ({pastePreview.length} rows)</Label>
                <div className="border rounded-lg overflow-x-auto max-h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map(c => <TableHead key={c.id} className="text-xs whitespace-nowrap py-1.5">{c.name}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastePreview.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          {columns.map(c => (
                            <TableCell key={c.id} className="text-xs py-1.5 max-w-[150px]">
                              <span className="line-clamp-1">{row[c.column_key] || <span className="text-muted-foreground italic">—</span>}</span>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {pastePreview.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="text-xs text-center text-muted-foreground py-1.5">
                            ...and {pastePreview.length - 10} more rows
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPaste(false); setPasteText(""); setPastePreview([]); }}>Cancel</Button>
            <Button onClick={handlePasteImport} disabled={pastePreview.length === 0 || createRow.isPending}>
              Import {pastePreview.length} Row{pastePreview.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Row</DialogTitle></DialogHeader>
          {editingRow && (
            <div className="space-y-3">
              {columns.map(c => (
                <div key={c.id}>
                  <Label className="text-xs">{c.name}</Label>
                  <Input value={editingRow.values[c.column_key] || ""} onChange={e => setEditingRow(prev => prev ? { ...prev, values: { ...prev.values, [c.column_key]: e.target.value } } : null)} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editingRow) {
                updateRow.mutate({ id: editingRow.id, values: editingRow.values });
                setEditingRow(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const AdminImplementingActDataTablesPage = () => {
  const { data: acts = [], isLoading } = useImplementingActs();
  const [selectedActId, setSelectedActId] = useState<string | null>(null);

  const selectedAct = acts.find(a => a.id === selectedActId);

  return (
    <AdminPageLayout
      title="Implementing Act Data Tables"
      description="Manage structured data tables (e.g., data element definitions, logical models) for each implementing act"
    >
      <div className="space-y-6">
        {/* Act selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Implementing Act</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {acts.map(act => (
                  <button
                    key={act.id}
                    onClick={() => setSelectedActId(act.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${selectedActId === act.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
                  >
                    <Badge variant="outline" className="text-xs mb-1">{act.articleReference}</Badge>
                    <p className="text-sm font-medium line-clamp-2">{act.title}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedAct && (
          <TableManager actId={selectedAct.id} actTitle={`${selectedAct.articleReference} — ${selectedAct.title}`} />
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AdminImplementingActDataTablesPage;
