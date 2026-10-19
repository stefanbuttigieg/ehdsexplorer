import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, FileText, Search, X } from 'lucide-react';
import type { FuseResultMatch } from 'fuse.js';
import { useSearch, getMatchContext, type SearchResults } from '@/hooks/useSearch';
import { useBetaExperience } from '@/contexts/BetaExperienceContext';
import { PopularTopicChips } from '@/components/PopularTopicChips';
import { HighlightedText } from '@/components/HighlightedText';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { BetaLayout } from './BetaLayout';

const TYPES: { key: keyof SearchResults; label: string }[] = [
  { key: 'articles', label: 'Articles' }, { key: 'recitals', label: 'Recitals' },
  { key: 'faqs', label: 'Official FAQs' }, { key: 'definitions', label: 'Definitions' },
  { key: 'implementingActs', label: 'Implementing acts' }, { key: 'chapters', label: 'Chapters' }, { key: 'annexes', label: 'Annexes' },
];
interface Result { id: string; type: keyof SearchResults; label: string; title: string; content: string; to: string; score: number; matches?: readonly FuseResultMatch[] }

function toResults(results: SearchResults): Result[] {
  return [
    ...results.articles.map(r => ({ id: `a${r.item.id}`, type: 'articles' as const, label: `Article ${r.item.article_number}`, title: r.item.title, content: r.item.normalizedContent, to: `/article/${r.item.article_number}`, score: r.score ?? 1, matches: r.matches })),
    ...results.recitals.map(r => ({ id: `r${r.item.id}`, type: 'recitals' as const, label: `Recital ${r.item.recital_number}`, title: `Recital ${r.item.recital_number}`, content: r.item.normalizedContent, to: `/recital/${r.item.recital_number}`, score: r.score ?? 1, matches: r.matches })),
    ...results.faqs.map(r => ({ id: `f${r.item.id}`, type: 'faqs' as const, label: `Official FAQ ${r.item.faq_number}`, title: r.item.question, content: r.item.normalizedAnswer, to: `/faq/${r.item.faq_number}`, score: r.score ?? 1, matches: r.matches })),
    ...results.definitions.map(r => ({ id: `d${r.item.id}`, type: 'definitions' as const, label: 'Definition', title: r.item.term, content: r.item.normalizedDefinition, to: '/definitions', score: r.score ?? 1, matches: r.matches })),
    ...results.implementingActs.map(r => ({ id: `i${r.item.id}`, type: 'implementingActs' as const, label: r.item.articleReference, title: r.item.title, content: r.item.normalizedDescription, to: `/implementing-acts/${r.item.id}`, score: r.score ?? 1, matches: r.matches })),
    ...results.chapters.map(r => ({ id: `c${r.item.id}`, type: 'chapters' as const, label: `Chapter ${r.item.chapter_number}`, title: r.item.title, content: r.item.normalizedDescription, to: `/chapter/${r.item.chapter_number}`, score: r.score ?? 1, matches: r.matches })),
    ...results.annexes.map(r => ({ id: `n${r.item.id}`, type: 'annexes' as const, label: `Annex ${r.item.id}`, title: r.item.title, content: r.item.normalizedContent, to: `/annex/${r.item.id}`, score: r.score ?? 1, matches: r.matches })),
  ].sort((a, b) => a.score - b.score);
}

// Fuse indices locate a meaningful excerpt even when the query is misspelled.
function ResultSnippet({ result, query }: { result: Result; query: string }) {
  const match = result.matches?.find(m => m.value === result.content && m.indices.length > 0);
  if (!match) return <HighlightedText text={getMatchContext(result.content, query, 140)} query={query} />;
  const first = match.indices[0];
  if (!first) return null;
  const start = Math.max(0, first[0] - 80), end = Math.min(result.content.length, first[1] + 180);
  const spans = match.indices.filter(([a, b]) => b >= start && a < end).sort((a, b) => a[0] - b[0]);
  const pieces = []; let cursor = start;
  for (const [a, b] of spans) {
    const left = Math.max(cursor, a), right = Math.min(end, b + 1);
    if (right <= left) continue;
    pieces.push(<span key={`t${cursor}`}>{result.content.slice(cursor, left)}</span>);
    pieces.push(<mark key={`m${left}`} className="bg-accent text-accent-foreground">{result.content.slice(left, right)}</mark>);
    cursor = right;
  }
  return <>{start > 0 && '…'}{pieces}{result.content.slice(cursor, end)}{end < result.content.length && '…'}</>;
}

export function BetaSearch() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const location = useLocation();
  const filterParam = params.get('type');
  const filter = TYPES.some(t => t.key === filterParam) ? filterParam : 'all';
  const [limit, setLimit] = useState(20);
  const { search, isLoading } = useSearch();
  const { rememberSearch } = useBetaExperience();
  const results = useMemo(() => search(query), [query, search]);
  const all = useMemo(() => toResults(results), [results]);
  const visible = filter === 'all' ? all : all.filter(r => r.type === filter);
  useEffect(() => { setLimit(20); }, [query, filter]);
  useEffect(() => {
    if (query.trim().length < 3) return;
    const timer = window.setTimeout(() => { supabase.rpc('record_search_query', { _query: query.trim() }).then(() => {}); }, 1500);
    return () => window.clearTimeout(timer);
  }, [query]);
  const updateQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value); else next.delete('q');
    setParams(next, { replace: true });
  };
  const updateFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('type'); else next.set('type', value);
    setParams(next, { replace: true });
  };
  return <BetaLayout>
    <section className={`mx-auto max-w-5xl px-4 sm:px-8 ${query ? 'pt-10' : 'pt-14 sm:pt-20'}`}>
      <div className="mb-8">
        <p className="mb-4 text-sm font-semibold uppercase text-secondary">European Health Data Space</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">{query ? 'Search EHDS' : 'EHDS Regulation Explorer'}</h1>
        {!query && <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">The regulation, official answers and implementing acts.</p>}
      </div>
      <form role="search" onSubmit={e => e.preventDefault()} className="flex min-h-16 items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring sm:px-5">
        <Search className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <label htmlFor="beta-search" className="sr-only">Search EHDS</label>
        <Input id="beta-search" type="search" placeholder="Search a topic, question or article…" value={query} onChange={e => updateQuery(e.target.value)} className="min-h-16 min-w-0 border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0 sm:text-lg" />
        {query && <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Clear search" onClick={() => updateQuery('')}><X className="h-4 w-4" /></Button>}
        <Button type="submit" size="icon" className="min-h-11 min-w-11" aria-label="Search"><ArrowRight className="h-5 w-5" /></Button>
      </form>
      {!query && <><PopularTopicChips searchOnly maxChips={5} />
        <div className="mt-14 grid gap-0 border-y border-border sm:grid-cols-3">
          {[['Regulation', 'Articles & recitals', '/articles'], ['Official FAQs', 'European Commission answers', '/faqs'], ['Implementing acts', 'Progress & feedback', '/implementing-acts']].map(([title, subtitle, to]) => <Link key={to} to={to} className="flex min-h-28 items-center justify-between gap-4 border-b border-border py-6 pr-5 last:border-0 hover:text-primary sm:border-b-0 sm:px-5 sm:first:pl-0"><div><h2 className="font-serif text-base font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-primary" /></Link>)}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><BookOpen className="h-4 w-4" /><span>Regulation (EU) 2025/327</span><Button asChild variant="link" className="h-auto p-0"><Link to="/overview">Overview <ArrowRight className="ml-2 h-3 w-3" /></Link></Button></div>
      </>}
      {query && <>
        <nav aria-label="Result type" className="mt-7 flex flex-wrap gap-2">
          <Button variant={filter === 'all' ? 'default' : 'ghost'} className="min-h-11" aria-pressed={filter === 'all'} onClick={() => updateFilter('all')}>All {all.length}</Button>
          {TYPES.map(t => <Button key={t.key} variant={filter === t.key ? 'default' : 'ghost'} className="min-h-11" aria-pressed={filter === t.key} onClick={() => updateFilter(t.key)}>{t.label} {results[t.key].length}</Button>)}
        </nav>
        <p role="status" aria-live="polite" className="my-6 text-sm text-muted-foreground">{isLoading ? 'Searching…' : `${visible.length} results${filter === 'all' ? ' · Best matches first' : ''}`}</p>
        {isLoading ? <div className="space-y-4">{[1, 2, 3].map(n => <Skeleton key={n} className="h-28" />)}</div> : <div>
          {visible.slice(0, limit).map(result => <Link key={result.id} to={result.to} onClick={() => rememberSearch(`${location.pathname}${location.search}`)} className="group block border-t border-border py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${result.label}: ${result.title}`}>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-secondary"><FileText className="h-3.5 w-3.5" />{result.label}</div>
            <div className="flex items-start justify-between gap-4"><h2 className="font-serif text-lg font-semibold leading-relaxed group-hover:text-primary"><HighlightedText text={result.title} query={query} /></h2><ArrowRight className="mt-2 h-4 w-4 shrink-0 text-primary" /></div>
            <p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground"><ResultSnippet result={result} query={query} /></p>
          </Link>)}
          {visible.length === 0 && <div className="border-t border-border py-12"><h2 className="font-serif text-xl font-semibold">No matches{filter !== 'all' ? ' in this content type' : ''}</h2>{filter !== 'all' && all.length > 0 ? <Button variant="link" onClick={() => updateFilter('all')}>View all {all.length} results</Button> : <p className="mt-3 text-muted-foreground">No results for “{query}”.</p>}</div>}
          {visible.length > limit && <Button variant="outline" className="mt-6 min-h-11 w-full" onClick={() => setLimit(n => n + 20)}>Show more results ({visible.length - limit} remaining)</Button>}
        </div>}
      </>}
    </section>
  </BetaLayout>;
}