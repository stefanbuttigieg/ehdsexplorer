import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, ExternalLink, Eye, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';

type KeywordRow = {
  id: string;
  keyword: string;
  database: string;
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
  our_position: number | null;
  our_url: string | null;
  notes: string | null;
  last_refreshed_at: string | null;
};

type SerpRow = {
  id: string;
  position: number;
  domain: string;
  url: string;
  captured_at: string;
};

function difficultyBadge(d: number | null) {
  if (d === null) return <span className="text-muted-foreground">—</span>;
  const variant: "secondary" | "default" | "destructive" =
    d < 30 ? 'secondary' : d < 60 ? 'default' : 'destructive';
  const label = d < 30 ? 'Easy' : d < 60 ? 'Medium' : 'Hard';
  return <Badge variant={variant}>{d}/100 · {label}</Badge>;
}

export function SEOKeywordRankings() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newKw, setNewKw] = useState('');
  const [serpFor, setSerpFor] = useState<KeywordRow | null>(null);

  const { data: keywords, isLoading } = useQuery({
    queryKey: ['seo-keyword-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_keyword_rankings')
        .select('*')
        .order('search_volume', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as KeywordRow[];
    },
  });

  const { data: serpRows } = useQuery({
    queryKey: ['seo-serp-snapshots', serpFor?.id],
    enabled: !!serpFor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_serp_snapshots')
        .select('*')
        .eq('keyword_id', serpFor!.id)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as SerpRow[];
    },
  });

  const addKeyword = useMutation({
    mutationFn: async (keyword: string) => {
      const { error } = await supabase
        .from('seo_keyword_rankings')
        .insert({ keyword: keyword.trim().toLowerCase(), database: 'uk' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Keyword added. Ask the agent to refresh Semrush data.');
      qc.invalidateQueries({ queryKey: ['seo-keyword-rankings'] });
      setAddOpen(false);
      setNewKw('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seo_keyword_rankings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Removed');
      qc.invalidateQueries({ queryKey: ['seo-keyword-rankings'] });
    },
  });

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Rankings data is sourced from <strong>Semrush</strong> via the Lovable agent. To refresh
          metrics or pull a fresh SERP snapshot, ask the agent: <em>"Refresh Semrush data for keyword X"</em>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>Tracked Keywords</CardTitle>
            <CardDescription>Target search terms for ehdsexplorer.eu (UK database)</CardDescription>
          </div>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add keyword
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Volume / mo</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Our position</TableHead>
                  <TableHead>Last refreshed</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords?.map(k => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.keyword}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {k.search_volume?.toLocaleString() ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{difficultyBadge(k.difficulty)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {k.cpc != null ? `$${Number(k.cpc).toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {k.our_position
                        ? <Badge variant={k.our_position <= 10 ? 'default' : 'secondary'}>#{k.our_position}</Badge>
                        : <span className="text-muted-foreground text-sm">Not ranking</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.last_refreshed_at ? formatDistanceToNow(new Date(k.last_refreshed_at), { addSuffix: true }) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSerpFor(k)} title="View SERP">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm(`Remove "${k.keyword}"?`)) removeKeyword.mutate(k.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!keywords?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No keywords tracked yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track a new keyword</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Input
              placeholder="e.g. ehds compliance"
              value={newKw}
              onChange={e => setNewKw(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newKw.trim()) addKeyword.mutate(newKw); }}
            />
            <p className="text-xs text-muted-foreground">
              After saving, ask the agent to pull Semrush metrics for this keyword.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addKeyword.mutate(newKw)} disabled={!newKw.trim() || addKeyword.isPending}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SERP dialog */}
      <Dialog open={!!serpFor} onOpenChange={(o) => !o && setSerpFor(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top 10 SERP — "{serpFor?.keyword}"</DialogTitle>
          </DialogHeader>
          {!serpRows?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No SERP snapshot yet. Ask the agent: <em>"Pull SERP for {serpFor?.keyword}"</em>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serpRows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.position}</TableCell>
                    <TableCell className="font-medium">{r.domain}</TableCell>
                    <TableCell>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
