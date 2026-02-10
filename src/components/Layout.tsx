import { ReactNode, useState, useEffect, useMemo } from "react";
import { version } from '../../package.json';
import { Link, useLocation } from "react-router-dom";
import { Book, FileText, Scale, ListChecks, Bookmark, Search, Menu, X, Home, ChevronDown, Files, Keyboard, Github, Shield, Cookie, ScrollText, Accessibility, Code, Newspaper, Settings, HelpCircle, StickyNote, Users, GitCompare, PanelLeftClose, PanelLeft, Trophy, MapPin, Brain, Network, Heart, Laptop, Stethoscope, Sparkles, Wrench } from "lucide-react";
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
  
  // Base nav items that are always visible
  const baseNavItems = [{
    path: "/",
    icon: Home,
    label: "Home"
  }, {
    path: "/overview",
    icon: Book,
    label: "Overview"
  }, {
    path: "/definitions",
    icon: FileText,
    label: "Definitions"
  }, {
    path: "/articles",
    icon: FileText,
    label: "Articles"
  }, {
    path: "/recitals",
    icon: Scale,
    label: "Recitals"
  }, {
    path: "/annexes",
    icon: Files,
    label: "Annexes"
  }, {
    path: "/implementing-acts",
    icon: ListChecks,
    label: "Implementing Acts"
  }, {
    path: "/health-authorities",
    icon: MapPin,
    label: "National Entities"
  }, {
    path: "/cross-regulation-map",
    icon: Network,
    label: "Regulatory Map"
  }, {
    path: "/for/citizens",
    icon: Heart,
    label: "For Citizens"
  }, {
    path: "/for/healthtech",
    icon: Laptop,
    label: "For Health Tech"
  }, {
    path: "/for/healthcare-professionals",
    icon: Stethoscope,
    label: "For Healthcare Pros"
  }, {
    path: "/topic-index",
    icon: FileText,
    label: "Topic Index"
  }, {
    path: "/tools",
    icon: Wrench,
    label: "Tools Hub"
  }, {
    path: "/scenario-finder",
    icon: Sparkles,
    label: "Scenario Finder"
  }, {
    path: "/news",
    icon: Newspaper,
    label: "News"
  }, {
    path: "/bookmarks",
    icon: Bookmark,
    label: "Bookmarks"
  }, {
    path: "/notes",
    icon: StickyNote,
    label: "Notes"
  }, {
    path: "/profile?tab=achievements",
    icon: Trophy,
    label: "Achievements"
  }, {
    path: "/compare",
    icon: GitCompare,
    label: "Compare"
  }, {
    path: "/games",
    icon: Brain,
    label: "Games"
  }];
  
  // Filter nav items based on feature flags
  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    
    // Add Teams only if enabled
    if (isFeatureEnabled('teams')) {
      // Insert Teams before Compare
      const compareIndex = items.findIndex(item => item.path === '/compare');
      items.splice(compareIndex, 0, {
        path: "/teams",
        icon: Users,
        label: "Teams"
      });
    }
    
    return items;
  }, [isFeatureEnabled]);
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
            <StakeholderFilter />
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

            {/* Chapters Accordion - Only when expanded */}
            {!sidebarCollapsed && <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen} className="mt-4" data-tour="sidebar-chapters">
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

            {/* Help Center & Developer Links - Only when expanded */}
            {!sidebarCollapsed && <div className="pt-2 space-y-1">
                <Link to="/help" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground", isActive("/help") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <HelpCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Help Center</span>
                  </Button>
                </Link>
                <Link to="/api" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground", isActive("/api") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <Code className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">API Documentation</span>
                  </Button>
                </Link>
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
                <Link to="/privacy-policy" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground h-8 text-sm", isActive("/privacy-policy") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">Privacy Policy</span>
                  </Button>
                </Link>
                <Link to="/cookies-policy" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground h-8 text-sm", isActive("/cookies-policy") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <Cookie className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">Cookies Policy</span>
                  </Button>
                </Link>
                <Link to="/terms-of-service" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground h-8 text-sm", isActive("/terms-of-service") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <ScrollText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">Terms of Service</span>
                  </Button>
                </Link>
                <Link to="/accessibility" onClick={() => setSidebarOpen(false)}>
                  <Button variant="ghost" className={cn("w-full justify-start gap-2 text-muted-foreground h-8 text-sm", isActive("/accessibility") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <Accessibility className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">Accessibility</span>
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground px-3 pt-4 pb-2">v{version} ({__BUILD_DATE__})</p>
              </div>}
            
            {/* Version indicator - collapsed state */}
            {sidebarCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center py-2 text-xs text-muted-foreground cursor-default">
                    v
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">v{version} ({__BUILD_DATE__})</TooltipContent>
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
          <MFAReminderBanner />
          <div className="p-4">
            <NotificationsBanner />
          </div>
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