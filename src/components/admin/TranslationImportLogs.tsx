import { useState, useEffect } from 'react';
import { AlertTriangle, Check, X, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ImportLog {
  id: string;
  language_code: string;
  status: string;
  articles_count: number;
  recitals_count: number;
  definitions_count: number;
  annexes_count: number;
  footnotes_count: number;
  error_message: string | null;
  source_url: string | null;
  content_length: number;
  parser_detected_language: string | null;
  import_type: string;
  created_at: string;
}

export function TranslationImportLogs() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('translation_import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) as { data: ImportLog[] | null };
    setLogs(data || []);
    setLoading(false);
  };

  const clearLogs = async () => {
    await supabase.from('translation_import_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setLogs([]);
  };

  useEffect(() => { fetchLogs(); }, []);

  const errorLogs = logs.filter(l => l.status === 'error');
  const successLogs = logs.filter(l => l.status === 'done');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Import Logs
            </CardTitle>
            <CardDescription className="text-xs">
              {errorLogs.length} errors, {successLogs.length} successes
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {logs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearLogs}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No import logs yet</p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-1.5">
              {logs.map(log => (
                <div key={log.id} className="flex flex-col gap-0.5 p-2 rounded border text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === 'error' ? (
                        <X className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      )}
                      <span className="font-mono text-xs font-medium">{log.language_code.toUpperCase()}</span>
                      <Badge variant={log.status === 'error' ? 'destructive' : 'default'} className="text-xs">
                        {log.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  {log.status === 'done' && (
                    <p className="text-xs text-muted-foreground pl-5">
                      {log.articles_count}A / {log.recitals_count}R
                      {log.definitions_count > 0 ? ` / ${log.definitions_count}D` : ''}
                      {log.annexes_count > 0 ? ` / ${log.annexes_count}X` : ''}
                      {log.footnotes_count > 0 ? ` / ${log.footnotes_count}F` : ''}
                      {log.content_length > 0 ? ` · ${(log.content_length / 1024).toFixed(0)}KB` : ''}
                    </p>
                  )}
                  {log.error_message && (
                    <p className="text-xs text-destructive pl-5 break-all">{log.error_message}</p>
                  )}
                  {log.source_url && (
                    <p className="text-xs text-muted-foreground pl-5 truncate">{log.source_url}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
