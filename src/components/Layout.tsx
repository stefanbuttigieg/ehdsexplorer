import { ReactNode, useState, useEffect, useMemo } from "react";
import { version } from '../../package.json';
import { Link, useLocation } from "react-router-dom";
import { Book, FileText, Scale, ListChecks, Bookmark, Search, Menu, X, Home, ChevronDown, Files, Keyboard, Github, Shield, Cookie, ScrollText, Accessibility, Code, Newspaper, Settings, HelpCircle, StickyNote, Users, GitCompare, PanelLeftClose, PanelLeft, Trophy, MapPin, Brain, Network, Heart, Laptop, Stethoscope, Sparkles, Wrench, Globe, Medal, MessageCircleQuestion, BookOpen, Layers, ExternalLink, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSidebarItems, type SidebarItem } from "@/hooks/useSidebarItems";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toRoman } from "@/lib/romanNumerals";
import { useChapters } from "@/hooks/useChapters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { SearchCommand } from "@/components/SearchCommand";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationsBanner } from "@/components/NotificationsBanner";
import { PublicTour, usePublicTour } from "@/components/PublicTour";
import { TourButton } from "@/components/TourButton";
import { ShareTextButton } from "@/components/ShareTextButton";
import { useTextHighlight } from "@/hooks/useTextHighlight";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AIAssistant from "@/components/AIAssistant";
import { LanguageSelector } from "@/components/LanguageSelector";
import { UserMenu } from "@/components/UserMenu";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import ReloadPrompt from "@/components/ReloadPrompt";
import { StakeholderFilter } from "@/components/StakeholderFilter";
import MobileBottomNav from "@/components/MobileBottomNav";
import { MFAReminderBanner } from "@/components/mfa/MFAReminderBanner";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { KidsModeToggle } from "@/components/KidsModeToggle";
import { useKidsMode } from "@/contexts/KidsModeContext";
import { LeaderboardTracker } from "@/components/LeaderboardTracker";

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Book, FileText, Scale, Files, ListChecks, Globe, Network, GitCompare,
  Heart, Laptop, Stethoscope, Wrench, Sparkles, Newspaper, MessageCircleQuestion,
  Bookmark, StickyNote, Trophy, Medal, Brain, HelpCircle, Code, Shield, Cookie,
  ScrollText, Accessibility, Users, Settings, MapPin, BookOpen, Layers, ExternalLink,
  Search, Menu, X,
};

const ROUTE_TO_PLACEMENT: Record<string, string> = {
  '/': 'home',
  '/articles': 'articles',
  '/recitals': 'recitals',
  '/definitions': 'definitions',
  '/implementing-acts': 'implementing_acts',
  '/annexes': 'annexes',
  '/news': 'news',
  '/for-citizens': 'for_citizens',
  '/for-healthcare': 'for_healthcare',
  '/for-healthtech': 'for_healthtech',
  '/health-authorities': 'health_authorities',
  '/cross-regulation': 'cross_regulation',
  '/games': 'games',
  '/tools': 'tools',
};

// Map sidebar labels to translation keys for i18n
const LABEL_TO_KEY: Record<string, string> = {
  "Home": "nav.home", "Overview": "nav.overview", "Definitions": "nav.definitions",
  "Articles": "nav.articles", "Recitals": "nav.recitals", "Annexes": "nav.annexes",
  "Implementing Acts": "nav.implementing_acts", "EHDS Country Map": "nav.country_map",
  "Regulatory Map": "nav.regulatory_map", "Article Dependencies": "nav.article_dependencies",
  "Content Network": "nav.content_network", "For Citizens": "nav.for_citizens",
  "For Health Tech": "nav.for_healthtech", "For Healthcare Pros": "nav.for_healthcare",
  "Topic Index": "nav.topic_index", "Tools Hub": "nav.tools_hub",
  "Scenario Finder": "nav.scenario_finder", "News": "nav.news",
  "Official FAQs": "nav.faqs", "Bookmarks": "nav.bookmarks", "Notes": "nav.notes",
  "Achievements": "nav.achievements", "Compare": "nav.compare",
  "Leaderboard": "nav.leaderboard", "Games": "nav.games", "Comics": "nav.comics",
  "Help Center": "nav.help_center", "API Documentation": "nav.api_docs",
  "Privacy Policy": "nav.privacy_policy", "Cookie Policy": "nav.cookie_policy",
  "Terms of Service": "nav.terms_of_service", "Accessibility Statement": "nav.accessibility",
  "Chapters": "nav.chapters", "Search": "ui.search",
  "Keyboard shortcuts": "ui.keyboard_shortcuts",
};

function LayoutDisclaimers({ pathname }: { pathname: string }) {
  const placement = ROUTE_TO_PLACEMENT[pathname];
  if (!placement) return null;
  return (
    <div className="px-4 pt-2">
      <DisclaimerBanner placement={placement} />
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored === 'true';
  });
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const {
    data: chapters,
    isLoading: chaptersLoading
  } = useChapters();
  const {
    isTourOpen,
    startTour,
    completeTour,
    closeTour
  } = usePublicTour();
  const {
    user,
    isEditor,
    loading: authLoading
  } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const { isKidsMode, isKidsFriendlyRoute } = useKidsMode();
  const { t } = useLanguage();
  const { data: dbSidebarItems } = useSidebarItems();

  // Helper to translate a label via the LABEL_TO_KEY map
  const tLabel = (label: string) => {
    const key = LABEL_TO_KEY[label];
    return key ? t(key, label) : label;
  };
  // Initialize text highlight hook for URL-based highlighting
  useTextHighlight();

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useKeyboardShortcuts({
    onHelp: () => setShortcutsOpen(true),
    onSearch: () => setSearchOpen(true)
  });
  const isActive = (path: string) => location.pathname === path;
  
  // Hardcoded fallback nav items (used while DB loads)
  const fallbackNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/overview", icon: Book, label: "Overview" },
    { path: "/definitions", icon: FileText, label: "Definitions" },
    { path: "/articles", icon: FileText, label: "Articles" },
    { path: "/recitals", icon: Scale, label: "Recitals" },
    { path: "/annexes", icon: Files, label: "Annexes" },
    { path: "/implementing-acts", icon: ListChecks, label: "Implementing Acts" },
    { path: "/health-authorities", icon: Globe, label: "EHDS Country Map" },
    { path: "/cross-regulation-map", icon: Network, label: "Regulatory Map" },
    { path: "/article-dependencies", icon: GitCompare, label: "Article Dependencies" },
    { path: "/content-network", icon: Network, label: "Content Network" },
    { path: "/for/citizens", icon: Heart, label: "For Citizens" },
    { path: "/for/healthtech", icon: Laptop, label: "For Health Tech" },
    { path: "/for/healthcare-professionals", icon: Stethoscope, label: "For Healthcare Pros" },
    { path: "/topic-index", icon: FileText, label: "Topic Index" },
    { path: "/tools", icon: Wrench, label: "Tools Hub" },
    { path: "/scenario-finder", icon: Sparkles, label: "Scenario Finder" },
    { path: "/news", icon: Newspaper, label: "News" },
    { path: "/faqs", icon: MessageCircleQuestion, label: "Official FAQs" },
    { path: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { path: "/notes", icon: StickyNote, label: "Notes" },
    { path: "/profile?tab=achievements", icon: Trophy, label: "Achievements" },
    { path: "/compare", icon: GitCompare, label: "Compare" },
    { path: "/leaderboard", icon: Medal, label: "Leaderboard" },
    { path: "/games", icon: Brain, label: "Games" },
  ];

  // Convert DB sidebar items to nav format
  const dbMainItems = useMemo(() => {
    if (!dbSidebarItems) return null;
    return dbSidebarItems
      .filter(i => i.section === "main")
      .map(i => ({
        path: i.path,
        icon: ICON_MAP[i.icon_name] || FileText,
        label: i.label,
        openExternal: i.open_external,
      }));
  }, [dbSidebarItems]);

  const dbUtilityItems = useMemo(() => {
    if (!dbSidebarItems) return null;
    return dbSidebarItems
      .filter(i => i.section === "utility")
      .map(i => ({
        path: i.path,
        icon: ICON_MAP[i.icon_name] || FileText,
        label: i.label,
        openExternal: i.open_external,
      }));
  }, [dbSidebarItems]);

  const dbLegalItems = useMemo(() => {
    if (!dbSidebarItems) return null;
    return dbSidebarItems
      .filter(i => i.section === "legal")
      .map(i => ({
        path: i.path,
        icon: ICON_MAP[i.icon_name] || FileText,
        label: i.label,
        openExternal: i.open_external,
      }));
  }, [dbSidebarItems]);

  // Use DB items if available, otherwise fallback
  const navItems = useMemo(() => {
    let items = (dbMainItems && dbMainItems.length > 0) ? dbMainItems : fallbackNavItems;

    // Filter to kid-friendly routes when Kids Mode is active
    if (isKidsMode) {
      items = items.filter(item => isKidsFriendlyRoute(item.path));
      if (!items.find(item => item.path === '/kids')) {
        items = [items[0], { path: "/kids", icon: Heart, label: "Comics" }, ...items.slice(1)];
      }
    }
    
    return items;
  }, [dbMainItems, isKidsMode, isKidsFriendlyRoute]);
  
  return <div className="min-h-screen flex w-full">
      {/* Mobile Header - simplified, removed menu button since we have bottom nav */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border flex items-center justify-between px-4 md:hidden z-50" style={{
      paddingTop: 'env(safe-area-inset-top)',
      height: 'calc(3.5rem + env(safe-area-inset-top))'
    }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-md">
            <Book className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-base">EHDS Explorer</span>
        </Link>
        <div className="flex items-center gap-1" data-tour="accessibility">
          <StakeholderFilter compact />
          <KidsModeToggle compact />
          <LanguageSelector variant="compact" />
          <AccessibilityControls />
          <UserMenu />
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-background/80 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed md:sticky top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transition-all duration-200 md:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full", sidebarCollapsed ? "md:w-14" : "w-72")} style={{
      paddingTop: 'env(safe-area-inset-top)'
    }}>
        <div className="h-14 border-b border-sidebar-border flex items-center justify-between px-2">
          {/* Collapse Toggle Button - Desktop Only */}
          <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8 flex-shrink-0" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
          
          {!sidebarCollapsed && <>
              <Link to="/" className="font-serif font-bold text-lg text-sidebar-foreground flex-1 px-2">EHDS Explorer</Link>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </>}
        </div>

        {/* Toolbar Row - Only when expanded */}
        {!sidebarCollapsed && <div className="hidden gap-1 px-3 py-2 border-b border-sidebar-border md:flex items-center justify-center flex-wrap" data-tour="accessibility">
            <StakeholderFilter compact />
            <KidsModeToggle compact />
            <UserMenu />
            <LanguageSelector variant="compact" />
            <TourButton onClick={startTour} />
            <ReportIssueButton />
            <AccessibilityControls />
          </div>}
        
        <ScrollArea className={cn(sidebarCollapsed ? "h-[calc(100vh-3.5rem)]" : "h-[calc(100vh-7rem)]")}>
          <div className={cn("space-y-2 overflow-hidden", sidebarCollapsed ? "p-2" : "p-4")}>
            {/* Search */}
            {sidebarCollapsed ? <Button variant="ghost" size="icon" className="w-full h-10" onClick={() => setSearchOpen(true)} title="Search">
                <Search className="h-4 w-4" />
              </Button> : <Button data-tour="sidebar-search" variant="outline" className="w-full justify-start gap-2 mb-4 overflow-hidden" onClick={() => setSearchOpen(true)}>
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Search...</span>
                <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-muted rounded">/</kbd>
              </Button>}

            {/* Nav Items */}
            <div data-tour="sidebar-nav">
              {navItems.map(item => <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                  {sidebarCollapsed ? <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant={isActive(item.path) ? "secondary" : "ghost"} size="icon" className={cn("w-full h-10", isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                          <item.icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip> : <Button variant={isActive(item.path) ? "secondary" : "ghost"} className={cn("w-full justify-start gap-2 overflow-hidden", isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>}
                </Link>)}
            </div>

            {/* Chapters Accordion - Only when expanded and not in Kids Mode */}
            {!sidebarCollapsed && !isKidsMode && <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen} className="mt-4" data-tour="sidebar-chapters">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="font-semibold">Chapters</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform flex-shrink-0", chaptersOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {chaptersLoading ? <div className="space-y-2 px-3">
                      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                    </div> : chapters && chapters.length > 0 ? chapters.map(chapter => <Link key={chapter.id} to={`/chapter/${chapter.chapter_number}`} onClick={() => setSidebarOpen(false)}>
                        <div className={cn("flex items-start gap-2 w-full text-left py-2 px-3 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors", location.pathname === `/chapter/${chapter.chapter_number}` && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                          <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{toRoman(chapter.chapter_number)}.</span>
                          <span className="break-words whitespace-normal">{chapter.title}</span>
                        </div>
                      </Link>) : <p className="text-xs text-muted-foreground px-3 py-2">No chapters configured</p>}
                </CollapsibleContent>
              </Collapsible>}

            {/* Keyboard Shortcuts Button */}
            {sidebarCollapsed ? <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-full h-10 text-muted-foreground" onClick={() => setShortcutsOpen(true)}>
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Keyboard shortcuts</TooltipContent>
              </Tooltip> : <Button variant="ghost" className="w-full justify-start gap-2 mt-4 text-muted-foreground" onClick={() => setShortcutsOpen(true)} data-tour="keyboard-shortcuts">
                <Keyboard className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Keyboard shortcuts</span>
                <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-muted rounded">?</kbd>
              </Button>}
            
            {/* Take a Tour Button - Only when expanded */}
            {!sidebarCollapsed && <TourButton onClick={startTour} variant="full" />}

            {/* Utility Links - Only when expanded */}
            {!sidebarCollapsed && <div className="pt-2 space-y-1">
                {(dbUtilityItems || [
                  { path: "/help", icon: HelpCircle, label: "Help Center" },
                  { path: "/api", icon: Code, label: "API Documentation" },
                ]).map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                    <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground", isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                ))}
                <a href="https://github.com/stefanbuttigieg/ehdsexplorer" target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
                    <Github className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">GitHub</span>
                  </Button>
                </a>
              </div>}

            {/* Legal Links - Only when expanded */}
            {!sidebarCollapsed && <div className="pt-4 mt-4 border-t border-sidebar-border">
                <p className="text-xs text-muted-foreground px-3 mb-2">Legal</p>
                {(dbLegalItems || [
                  { path: "/privacy-policy", icon: Shield, label: "Privacy Policy" },
                  { path: "/cookies-policy", icon: Cookie, label: "Cookies Policy" },
                  { path: "/terms-of-service", icon: ScrollText, label: "Terms of Service" },
                  { path: "/accessibility", icon: Accessibility, label: "Accessibility" },
                ]).map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                    <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground h-8 text-sm", isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                      <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Button>
                  </Link>
                ))}
                <p className="text-xs text-muted-foreground px-3 pt-4 pb-6">v{version} · {__BUILD_HASH__}</p>
              </div>}
            
            {/* Version indicator - collapsed state */}
            {sidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center py-2 text-xs text-muted-foreground cursor-default">
                    v
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">v{version} · {__BUILD_HASH__}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Search Command Palette */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Public Tour */}
      <PublicTour run={isTourOpen} onComplete={completeTour} onClose={closeTour} />

      {/* Main Content - add bottom padding for mobile nav */}
      <main className="flex-1 md:pt-0 flex flex-col pb-14 md:pb-0" style={{
      paddingTop: 'calc(3.5rem + env(safe-area-inset-top))'
    }}>
        <div className="flex-1">
          <LeaderboardTracker />
          <MFAReminderBanner />
          <div className="p-4">
            <NotificationsBanner />
          </div>
          <LayoutDisclaimers pathname={location.pathname} />
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        onMenuClick={() => setSidebarOpen(true)} 
        onSearchClick={() => setSearchOpen(true)} 
      />

      {/* Share Text Button - appears when user selects text */}
      <ShareTextButton />

      {/* AI Assistant - conditionally rendered based on feature flag */}
      {isFeatureEnabled('ai_assistant') && <AIAssistant />}

      {/* PWA Reload Prompt */}
      <ReloadPrompt />
    </div>;
};
export default Layout;