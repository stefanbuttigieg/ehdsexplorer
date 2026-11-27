import { supabase } from "@/integrations/supabase/client";

export function makeSheetName(raw: string, used: Set<string>): string {
  const base = (raw.replace(/[\[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim() || "Table").slice(0, 31);
  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${n++})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(name.toLowerCase());
  return name;
}

/** Neutralise spreadsheet formula injection. */
export function safeCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export async function buildAllTablesWorkbook(acts: { id: string; articleReference?: string; title: string }[]): Promise<Blob> {
  const [{ data: tables, error: e1 }, { data: cols, error: e2 }, { data: rows, error: e3 }] = await Promise.all([
    supabase.from("implementing_act_data_tables").select("*").order("sort_order"),
    supabase.from("implementing_act_data_columns").select("*").order("sort_order"),
    supabase.from("implementing_act_data_rows").select("*").order("sort_order").range(0, 49999),
  ]);
  if (e1 || e2 || e3) throw e1 || e2 || e3;
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const contents = wb.addWorksheet("Contents");
  contents.columns = [
    { header: "Implementing act", width: 18 }, { header: "Act title", width: 50 },
    { header: "Table", width: 45 }, { header: "Sheet", width: 32 },
    { header: "Published", width: 11 }, { header: "Rows", width: 8 },
  ];
  contents.getRow(1).font = { bold: true };
  const used = new Set(["contents"]);
  const actOrder = new Map(acts.map((a, i) => [a.id, i]));
  const sorted = [...(tables ?? [])].sort((a, b) =>
    (actOrder.get(a.implementing_act_id) ?? 1e9) - (actOrder.get(b.implementing_act_id) ?? 1e9) || a.sort_order - b.sort_order);
  for (const t of sorted) {
    const act = acts.find(a => a.id === t.implementing_act_id);
    const ref = act?.articleReference || t.implementing_act_id;
    const sheetName = makeSheetName(`${ref} ${t.name}`, used);
    const tCols = (cols ?? []).filter(c => c.table_id === t.id);
    const tRows = (rows ?? []).filter(r => r.table_id === t.id);
    const ws = wb.addWorksheet(sheetName);
    ws.addRow([safeCell(`${ref} — ${t.name}`)]).font = { bold: true, size: 13 };
    if (t.description) ws.addRow([safeCell(t.description)]);
    ws.addRow([]);
    const header = ws.addRow(tCols.map(c => safeCell(c.name)));
    header.font = { bold: true };
    for (const r of tRows) {
      const v = (r.values ?? {}) as Record<string, unknown>;
      ws.addRow(tCols.map(c => safeCell(v[c.column_key])));
    }
    tCols.forEach((_, i) => { ws.getColumn(i + 1).width = 28; ws.getColumn(i + 1).alignment = { wrapText: true, vertical: "top" }; });
    const link = contents.addRow([safeCell(ref), safeCell(act?.title ?? ""), safeCell(t.name), sheetName, t.is_published ? "Yes" : "No", tRows.length]);
    link.getCell(4).value = { text: sheetName, hyperlink: `#'${sheetName.replace(/'/g, "''")}'!A1` };
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
