import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useBetaExperience } from '@/contexts/BetaExperienceContext';
import { useSidebarItems } from '@/hooks/useSidebarItems';
import { useChapters } from '@/hooks/useChapters';
import { useAuth } from '@/hooks/useAuth';
import { AccessibilityControls } from '@/components/AccessibilityControls';
import { UserMenu } from '@/components/UserMenu';
import { KidsModeToggle } from '@/components/KidsModeToggle';
import { NotificationsBanner } from '@/components/NotificationsBanner';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { MFAReminderBanner } from '@/components/mfa/MFAReminderBanner';
import { ShareTextButton } from '@/components/ShareTextButton';
import { useTextHighlight } from '@/hooks/useTextHighlight';
import { LanguageSelector } from '@/components/LanguageSelector';

const CORE_LINKS = [
  ['Overview', '/overview'], ['Articles', '/articles'], ['Recitals', '/recitals'],
  ['Definitions', '/definitions'], ['Annexes', '/annexes'], ['Official FAQs', '/faqs'],
  ['Implementing acts', '/implementing-acts'], ['Feedback insights', '/feedback-insights'],
  ['Topic index', '/topic-index'], ['Help center', '/help'], ['API documentation', '/api'],
  ['Privacy policy', '/privacy-policy'], ['Cookies policy', '/cookies-policy'],
  ['Terms of service', '/terms-of-service'], ['Accessibility', '/accessibility'],
];
const PLACEMENTS: Record<string, string> = { '/': 'home', '/beta': 'home', '/articles': 'articles', '/recitals': 'recitals', '/definitions': 'definitions', '/annexes': 'annexes', '/implementing-acts': 'implementing_acts', '/news': 'news', '/tools': 'tools', '/health-authorities': 'health_authorities' };

export function BetaLayout({ children }: { children: ReactNode }) {
  const { adopted, adopt, backToClassic, storageError, searchReturn } = useBetaExperience();
  const location = useLocation();
  const [browseOpen, setBrowseOpen] = useState(false);
  const { data: sidebar = [] } = useSidebarItems();
  const { data: chapters = [] } = useChapters();
  const { user } = useAuth();
  useTextHighlight();
  const links = new Map(CORE_LINKS.map(([label, path]) => [path, { label, path, external: false }]));
  for (const item of sidebar) {
    if ((!item.requires_auth || user) && !item.path.startsWith('/admin')) links.set(item.path, { label: item.label, path: item.path, external: item.open_external });
  }
  const onSearch = location.pathname === '/beta' || location.pathname === '/search' || location.pathname === '/';
  const placement = PLACEMENTS[location.pathname];

  return <div className="beta-shell min-h-screen bg-background text-foreground">
    <a href="#beta-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-background focus:p-3 focus:ring-2 focus:ring-ring">Skip to content</a>
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/beta" className="flex min-h-11 items-center gap-3" aria-label="EHDS Explorer beta search">
          <BookOpen className="h-7 w-7 text-primary" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold">EHDS Explorer</span>
          <span className="border-l border-border pl-3 text-xs font-semibold uppercase text-secondary">Beta</span>
        </Link>
        <div className="flex items-center gap-2">
          {!onSearch && <Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11" title="Search"><Link to="/beta" aria-label="Search"><Search className="h-5 w-5" /></Link></Button>}
          <Sheet open={browseOpen} onOpenChange={setBrowseOpen}>
            <SheetTrigger asChild><Button variant="ghost" className="min-h-11 gap-2">Browse <ChevronDown className="h-4 w-4" /></Button></SheetTrigger>
            <SheetContent className="beta-shell w-full overflow-y-auto sm:max-w-lg">
              <SheetHeader><SheetTitle>Browse EHDS</SheetTitle><SheetDescription>Regulation, guidance and tools</SheetDescription></SheetHeader>
              <nav aria-label="Browse all content" className="mt-6 grid gap-1">
                {[...links.values()].map(item => item.external ? <Button asChild key={item.path} variant="ghost" className="h-auto min-h-11 justify-between whitespace-normal text-left"><a href={item.path} target="_blank" rel="noopener noreferrer">{item.label}<ArrowUpRight className="h-4 w-4 shrink-0" /></a></Button> : <Button asChild key={item.path} variant="ghost" className="h-auto min-h-11 justify-start whitespace-normal text-left"><Link to={item.path} onClick={() => setBrowseOpen(false)}>{item.label}</Link></Button>)}
                <h2 className="mt-5 border-t border-border pt-5 font-serif font-semibold">Chapters</h2>
                {chapters.map(chapter => <Button asChild key={chapter.id} variant="ghost" className="h-auto min-h-11 justify-start whitespace-normal text-left"><Link to={`/chapter/${chapter.chapter_number}`} onClick={() => setBrowseOpen(false)}>{chapter.chapter_number}. {chapter.title}</Link></Button>)}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4"><LanguageSelector /><KidsModeToggle /><UserMenu /></div>
              </nav>
            </SheetContent>
          </Sheet>
          <AccessibilityControls />
        </div>
      </div>
    </header>
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
        <Button variant="ghost" size="sm" className="min-h-11 gap-2 text-muted-foreground" onClick={backToClassic}><ArrowLeft className="h-4 w-4" />Back to classic</Button>
        {adopted ? <span role="status" className="flex items-center gap-2 text-sm text-secondary"><Check className="h-4 w-4" />Beta is your default</span> : <Button variant="outline" size="sm" className="min-h-11" onClick={adopt}>Use beta by default</Button>}
      </div>
      {storageError && <p role="alert" className="px-4 pb-3 text-sm text-destructive">{storageError}</p>}
    </div>
    <main id="beta-content" tabIndex={-1} className="min-w-0">
      <MFAReminderBanner />
      <div className="mx-auto max-w-6xl px-4 sm:px-8"><NotificationsBanner />{placement && <DisclaimerBanner placement={placement} />}</div>
      {!onSearch && searchReturn && <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8"><Button asChild variant="ghost" className="gap-2"><Link to={searchReturn}><ArrowLeft className="h-4 w-4" />Back to search results</Link></Button></div>}
      {children}
    </main>
    <footer className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-8 text-sm text-muted-foreground sm:px-8">
      <span>Regulation (EU) 2025/327</span>
      <div className="flex flex-wrap gap-5"><Link to="/overview" className="hover:text-primary">About EHDS</Link><Link to="/help" className="hover:text-primary">Help</Link><Link to="/privacy-policy" className="hover:text-primary">Privacy</Link></div>
    </footer>
    <ShareTextButton />
  </div>;
}