import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileJson, FileText, AlertCircle, CheckCircle2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CountryFlag } from '@/components/CountryFlag';

const EU_COUNTRIES: Record<string, string> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia', CY: 'Cyprus',
  CZ: 'Czech Republic', DK: 'Denmark', EE: 'Estonia', FI: 'Finland', FR: 'France',
  DE: 'Germany', GR: 'Greece', HU: 'Hungary', IE: 'Ireland', IT: 'Italy',
  LV: 'Latvia', LT: 'Lithuania', LU: 'Luxembourg', MT: 'Malta', NL: 'Netherlands',
  PL: 'Poland', PT: 'Portugal', RO: 'Romania', SK: 'Slovakia', SI: 'Slovenia',
  ES: 'Spain', SE: 'Sweden',
};

const VALID_STATUSES = ['draft', 'tabled', 'under_review', 'adopted', 'published', 'in_force', 'superseded'];
const VALID_TYPES = ['transposition', 'related', 'amendment', 'preparatory'];

interface ParsedRow {
  country_code: string;
  country_name: string;
  title: string;
  official_title?: string;
  url?: string;
  summary?: string;
  language?: string;
  legislation_type: string;
  status: string;
  status_notes?: string;
  draft_date?: string;
  tabled_date?: string;
  adoption_date?: string;
  publication_date?: string;
  effective_date?: string;
  ehds_articles_referenced?: number[];
  implementing_act_ids?: string[];
  enforcement_measures?: string[];
  errors: string[];
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim()); current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

function parseArrayField(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {}
  return value.split(/[;|,]/).map(s => s.trim()).filter(Boolean);
}

function parseNumberArray(value: string | undefined): number[] {
  return parseArrayField(value).map(Number).filter(n => !isNaN(n));
}

function validateRow(raw: Record<string, string>): ParsedRow {
  const errors: string[] = [];
  const code = (raw.country_code || '').toUpperCase().trim();
  
  if (!code) errors.push('Missing country_code');
  else if (!EU_COUNTRIES[code]) errors.push(`Invalid country code: ${code}`);
  
  const title = (raw.title || '').trim();
  if (!title) errors.push('Missing title');
  
  const legType = (raw.legislation_type || 'transposition').toLowerCase().trim();
  if (!VALID_TYPES.includes(legType)) errors.push(`Invalid type: ${legType}`);
  
  const status = (raw.status || 'draft').toLowerCase().trim();
  if (!VALID_STATUSES.includes(status)) errors.push(`Invalid status: ${status}`);

  return {
    country_code: code,
    country_name: EU_COUNTRIES[code] || code,
    title,
    official_title: raw.official_title || undefined,
    url: raw.url || undefined,
    summary: raw.summary || undefined,
    language: raw.language || undefined,
    legislation_type: legType,
    status,
    status_notes: raw.status_notes || undefined,
    draft_date: raw.draft_date || undefined,
    tabled_date: raw.tabled_date || undefined,
    adoption_date: raw.adoption_date || undefined,
    publication_date: raw.publication_date || undefined,
    effective_date: raw.effective_date || undefined,
    ehds_articles_referenced: parseNumberArray(raw.ehds_articles_referenced),
    implementing_act_ids: parseArrayField(raw.implementing_act_ids),
    enforcement_measures: parseArrayField(raw.enforcement_measures),
    errors,
  };
}

function downloadTemplate() {
  const headers = [
    'country_code', 'title', 'official_title', 'url', 'summary', 'language',
    'legislation_type', 'status', 'status_notes',
    'draft_date', 'tabled_date', 'adoption_date', 'publication_date', 'effective_date',
    'ehds_articles_referenced', 'implementing_act_ids', 'enforcement_measures',
  ];
  const example = [
    'DE', 'Digital Health Data Act', 'Gesetz zur Umsetzung des EHDS', 'https://example.com', 'Summary text', 'de',
    'transposition', 'draft', '',
    '2025-01-15', '', '', '', '',
    '3;5;7', '', 'administrative_fines;reporting_obligations',
  ];
  const csv = [headers.join(','), example.map(v => `"${v}"`).join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'legislation_import_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LegislationBulkImport({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const reset = () => { setRows([]); setProgress(0); setResult(null); };

  const handleFile = useCallback(async (file: File) => {
    reset();
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : [data];
        setRows(arr.map((r: Record<string, string>) => validateRow(r)));
      } catch { toast.error('Invalid JSON file'); }
    } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const text = await file.text();
      const parsed = parseCSV(text);
      setRows(parsed.map(validateRow));
    } else if (ext === 'xlsx' || ext === 'xls') {
      toast.error('XLSX files are not supported in browser. Please export as CSV first.');
    } else {
      toast.error('Unsupported file type. Use CSV or JSON.');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true); setProgress(0); setResult(null);
    let success = 0; let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const { errors, ...data } = row;
      try {
        const { error } = await supabase.from('country_legislation').insert({
          country_code: data.country_code,
          country_name: data.country_name,
          title: data.title,
          official_title: data.official_title || null,
          url: data.url || null,
          summary: data.summary || null,
          language: data.language || null,
          legislation_type: data.legislation_type,
          status: data.status,
          status_notes: data.status_notes || null,
          draft_date: data.draft_date || null,
          tabled_date: data.tabled_date || null,
          adoption_date: data.adoption_date || null,
          publication_date: data.publication_date || null,
          effective_date: data.effective_date || null,
          ehds_articles_referenced: data.ehds_articles_referenced || [],
          implementing_act_ids: data.implementing_act_ids || [],
          enforcement_measures: data.enforcement_measures || [],
        });
        if (error) { failed++; console.error('Insert error:', error); }
        else success++;
      } catch { failed++; }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setResult({ success, failed });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['country-legislation'] });
    if (success > 0) toast.success(`Imported ${success} legislation record(s)`);
    if (failed > 0) toast.error(`${failed} record(s) failed to import`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importing) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Bulk Import National Legislation
          </DialogTitle>
          <DialogDescription>
            Import legislation records from a CSV or JSON file. Download the template to see the expected format.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 && !result ? (
          <div className="space-y-4">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv,.json,.tsv,.txt'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }; input.click(); }}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports CSV and JSON</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> CSV</Badge>
                <Badge variant="outline" className="gap-1"><FileJson className="h-3 w-3" /> JSON</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Download CSV Template
            </Button>
          </div>
        ) : result ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="text-center">
                <p className="font-medium text-lg">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  {result.success} imported, {result.failed} failed
                  {invalidRows.length > 0 && `, ${invalidRows.length} skipped (validation errors)`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {validRows.length} valid
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> {invalidRows.length} with errors
                </Badge>
              )}
              <Badge variant="outline">{rows.length} total rows</Badge>
              <Button variant="ghost" size="sm" onClick={reset} className="ml-auto gap-1">
                <X className="h-3 w-3" /> Clear
              </Button>
            </div>

            {invalidRows.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {invalidRows.length} row(s) have errors and will be skipped:
                  {invalidRows.slice(0, 3).map((r, i) => (
                    <span key={i} className="block ml-2">• Row "{r.title || '(no title)'}": {r.errors.join(', ')}</span>
                  ))}
                  {invalidRows.length > 3 && <span className="block ml-2">• ...and {invalidRows.length - 3} more</span>}
                </AlertDescription>
              </Alert>
            )}

            {importing && (
              <div className="space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}%</p>
              </div>
            )}

            <ScrollArea className="h-[40vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row.errors.length > 0 ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-xs">
                        {EU_COUNTRIES[row.country_code] ? (
                          <span className="flex items-center gap-1">
                            <CountryFlag countryCode={row.country_code} size="sm" />
                            {row.country_code}
                          </span>
                        ) : row.country_code || '—'}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{row.title || '—'}</TableCell>
                      <TableCell className="text-xs">{row.legislation_type}</TableCell>
                      <TableCell className="text-xs">{row.status}</TableCell>
                      <TableCell>
                        {row.errors.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-destructive" title={row.errors.join(', ')}>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result && rows.length > 0 && (
            <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
              {importing ? 'Importing...' : `Import ${validRows.length} Record(s)`}
            </Button>
          )}
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} disabled={importing}>
            {result ? 'Close' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
