import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Check, X, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function ImplementationAgentPanel() {
  const client = useQueryClient();
  const [url,setUrl] = useState(''); const [publisher,setPublisher] = useState(''); const [country,setCountry] = useState(''); const [official,setOfficial] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey:['implementation-agent'],queryFn:async()=> {
    const [sources,runs,candidates] = await Promise.all([
      supabase.from('implementation_agent_sources').select('*').order('country_code'),
      supabase.from('implementation_agent_runs').select('*').order('started_at',{ascending:false}).limit(20),
      supabase.from('implementation_agent_candidates').select('*').order('created_at',{ascending:false}).limit(100),
    ]);
    if (sources.error || runs.error || candidates.error) throw sources.error || runs.error || candidates.error;
    return { sources:sources.data ?? [],runs:runs.data ?? [],candidates:candidates.data ?? [] };
  }});
  const action = useMutation({ mutationFn:async(body:Record<string,unknown>)=> {
    const { data,error } = await supabase.functions.invoke('implementation-agent',{body});
    if(error) throw new Error(error instanceof FunctionsHttpError ? await error.context.text() : error.message);
    if (!data?.success) throw new Error(data?.error || 'Check failed');
    return data;
  },onSuccess:(result,body)=> { client.invalidateQueries({queryKey:['implementation-agent']}); client.invalidateQueries({queryKey:['country-obligation-statuses']}); toast.success(body.action === 'run' ? `${result.published ?? 0} published; ${result.candidates ?? 0} findings${result.unchanged ? ' — source unchanged' : ''}` : 'Saved'); },onError:(error)=> {toast.error(error.message);client.invalidateQueries({queryKey:['implementation-agent']});} });
  if(isLoading) return <p className="text-muted-foreground">Loading update agent…</p>;
  if(error) return <p className="text-destructive">{error.message}</p>;
  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Implementation update agent</h2><p className="text-sm text-muted-foreground">Official national evidence · Automatic publishing · Daily source rotation</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={()=>action.mutate({action:'settings',enabled:false})} disabled={action.isPending}>Pause</Button>
        <Button variant="outline" onClick={()=>action.mutate({action:'settings',enabled:true,resume:true})} disabled={action.isPending}>Resume</Button>
        <Button onClick={()=>action.mutate({action:'run'})} disabled={action.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${action.isPending ? 'animate-spin' : ''}`}/>Check next source</Button>
      </div>
    </div>
    <section className="space-y-3"><h3 className="font-semibold">Source coverage</h3>
      <p className="text-sm text-muted-foreground">{new Set(data?.sources.flatMap(s=>s.country_code ? [s.country_code] : [])).size} of 27 member states have configured national sources. EU-wide and research pages cannot establish country progress.</p>
      <div className="divide-y border-y">{data?.sources.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0 flex-1"><a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary font-medium">{s.publisher}<ExternalLink className="h-3 w-3 shrink-0"/></a><p className="text-xs text-muted-foreground">{s.country_code || 'EU / research'} · {s.official ? 'Official' : 'Research only'} · {s.last_checked_at ? new Date(s.last_checked_at).toLocaleString() : 'Not checked'}</p>{s.last_error && <p className="mt-1 text-sm text-destructive break-words">{s.last_error}</p>}</div>
        <Button variant="ghost" size="icon" aria-label={`Check ${s.publisher}`} disabled={action.isPending} onClick={()=>action.mutate({action:'run',source_id:s.id})}><RefreshCw className="h-4 w-4"/></Button>
      </div>)}</div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();action.mutate({action:'source',url,publisher,country_code:country.toUpperCase(),official});}}>
        <Input aria-label="Source URL" placeholder="Official source URL" type="url" value={url} onChange={e=>setUrl(e.target.value)} required/>
        <Input aria-label="Publisher" placeholder="Publisher" value={publisher} onChange={e=>setPublisher(e.target.value)} required/>
        <Input aria-label="Country ISO code" placeholder="Country ISO code, e.g. MT" maxLength={2} value={country} onChange={e=>setCountry(e.target.value)}/>
        <div className="flex items-center gap-2"><Switch id="official-agent-source" checked={official} onCheckedChange={setOfficial}/><Label htmlFor="official-agent-source">Verified official publisher</Label></div>
        <Button type="submit" variant="outline" disabled={action.isPending}><Plus className="mr-2 h-4 w-4"/>Add source</Button>
      </form>
    </section>
    <section className="space-y-3"><h3 className="font-semibold">Evidence and decisions</h3>
      {!data?.candidates.length && <p className="text-sm text-muted-foreground">No country-specific findings yet.</p>}
      {data?.candidates.map(c=><article key={c.id} className="border rounded-md p-4 space-y-2">
        <div className="flex flex-wrap justify-between gap-2"><h4 className="font-medium">{c.country_code} · {c.obligation_id.replace(/_/g,' ')} · {c.proposed_status.replace(/_/g,' ')}</h4><Badge variant="outline">{c.state}</Badge></div>
        <p className="text-sm">{c.summary}</p><blockquote className="border-l-2 pl-3 text-sm text-muted-foreground">{c.evidence_quote}</blockquote>
        <p className="text-xs text-muted-foreground">{c.reason} · Evidence: {c.evidence_date || 'Undated'} · Confidence: {Math.round(Number(c.confidence)*100)}%</p>
        <a className="text-sm text-primary" href={data.sources.find(s=>s.id===c.source_id)?.url} target="_blank" rel="noopener noreferrer">Source evidence</a>
        {c.state==='pending' && <div className="flex gap-2"><Button size="sm" variant="outline" disabled={action.isPending} onClick={()=>action.mutate({action:'approve',candidate_id:c.id})}><Check className="mr-2 h-4 w-4"/>Approve</Button><Button size="sm" variant="ghost" disabled={action.isPending} onClick={()=>action.mutate({action:'dismiss',candidate_id:c.id})}><X className="mr-2 h-4 w-4"/>Dismiss</Button></div>}
      </article>)}
    </section>
    <section><h3 className="font-semibold mb-3">Recent checks</h3><div className="divide-y">{data?.runs.map(r=><div key={r.id} className="py-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span>{data.sources.find(s=>s.id===r.source_id)?.publisher} · {new Date(r.started_at).toLocaleString()}</span><Badge variant="outline">{r.status}</Badge></div><p className="text-muted-foreground">{r.published} published · {r.candidates} findings</p>{r.error && <p className="text-destructive break-words">{r.error}</p>}</div>)}</div></section>
  </div>;
}