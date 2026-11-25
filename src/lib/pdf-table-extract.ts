export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  context: string;
}

const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l: string) => /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(l);

function cells(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split(/(?<!\\)\|/).map((c) =>
    c.replace(/\\\|/g, "|").replace(/<br\s*\/?>/gi, " ").replace(/\*\*/g, "").replace(/\s+/g, " ").trim(),
  );
}

/** Finds markdown tables (as produced by the PDF reader) in text. */
export function extractMarkdownTables(markdown: string): ExtractedTable[] {
  const lines = markdown.split(/\r?\n/);
  const tables: ExtractedTable[] = [];
  let i = 0;
  while (i < lines.length) {
    if (isRow(lines[i]) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const headers = cells(lines[i]);
      let context = "";
      for (let j = i - 1; j >= 0 && j >= i - 6; j--) {
        const t = lines[j].replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
        if (t && !isRow(lines[j])) { context = t.slice(0, 200); break; }
      }
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isRow(lines[i])) {
        if (!isSeparator(lines[i])) {
          const r = cells(lines[i]);
          while (r.length < headers.length) r.push("");
          const row = r.slice(0, headers.length);
          if (row.some((c) => c)) rows.push(row);
        }
        i++;
      }
      const filled = headers.map((h, idx) => h || `Column ${idx + 1}`);
      if (rows.length > 0) tables.push({ headers: filled, rows, context });
    } else i++;
  }
  return tables;
}

/** Unique snake_case keys for column headers. */
export function columnKeys(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h, idx) => {
    let base = h.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || `column_${idx + 1}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    if (n > 0) base = `${base}_${n + 1}`;
    return base;
  });
}
