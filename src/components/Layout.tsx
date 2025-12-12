import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Book, FileText, Scale, ListChecks, Bookmark, Search, Menu, X, Home, ChevronDown, Files, Keyboard, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChapters } from "@/hooks/useChapters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { SearchCommand } from "@/components/SearchCommand";
import { Skeleton } from "@/components/ui/skeleton";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();

  useKeyboardShortcuts({
    onHelp: () => setShortcutsOpen(true),
    onSearch: () => setSearchOpen(true),
  });

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/overview", icon: Book, label: "Overview" },
    { path: "/definitions", icon: FileText, label: "Definitions" },
    { path: "/recitals", icon: Scale, label: "Recitals" },
    { path: "/annexes", icon: Files, label: "Annexes" },
    { path: "/implementing-acts", icon: ListChecks, label: "Implementing Acts" },
    { path: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 md:hidden z-50">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="font-serif font-bold text-lg">EHDS Explorer</Link>
        <div className="flex items-center gap-1">
          <ReportIssueButton />
          <AccessibilityControls />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border z-50 transition-transform md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 border-b border-sidebar-border flex items-center justify-between px-4">
          <Link to="/" className="font-serif font-bold text-lg text-sidebar-foreground">EHDS Explorer</Link>
          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-1">
              <ReportIssueButton />
              <AccessibilityControls />
            </div>
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="p-4 space-y-2 overflow-hidden">
            {/* Search */}
            <Button variant="outline" className="w-full justify-start gap-2 mb-4 overflow-hidden" onClick={() => setSearchOpen(true)}>
              <Search className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Search...</span>
              <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-muted rounded">/</kbd>
            </Button>

            {/* Nav Items */}
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-2 overflow-hidden", isActive(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground")}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Button>
              </Link>
            ))}

            {/* Chapters Accordion */}
            <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="font-semibold">Chapters</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform flex-shrink-0", chaptersOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {chaptersLoading ? (
                  <div className="space-y-2 px-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : chapters && chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <Link key={chapter.id} to={`/chapter/${chapter.chapter_number}`} onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-start gap-2 w-full text-left py-2 px-3 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                          location.pathname === `/chapter/${chapter.chapter_number}` && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{chapter.chapter_number}.</span>
                        <span className="break-words whitespace-normal">{chapter.title}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground px-3 py-2">No chapters configured</p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Keyboard Shortcuts Button */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 mt-4 text-muted-foreground"
              onClick={() => setShortcutsOpen(true)}
            >
              <Keyboard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Keyboard shortcuts</span>
              <kbd className="ml-auto text-xs px-1.5 py-0.5 bg-muted rounded">?</kbd>
            </Button>

            {/* GitHub Link */}
            <a
              href="https://github.com/stefanbuttigieg/ehdsexplorer"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <Github className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">GitHub</span>
              </Button>
            </a>
          </div>
        </ScrollArea>
      </aside>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Search Command Palette */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Main Content */}
      <main className="flex-1 pt-14 md:pt-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
