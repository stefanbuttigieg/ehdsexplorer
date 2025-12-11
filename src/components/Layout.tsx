import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Book, FileText, Scale, ListChecks, Bookmark, Search, Menu, X, Home, ChevronDown, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chapters } from "@/data/chapters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const location = useLocation();

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
        <Link to="/search">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        </Link>
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
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="p-4 space-y-2 overflow-hidden">
            {/* Search */}
            <Link to="/search" onClick={() => setSidebarOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-2 mb-4 overflow-hidden">
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Search...</span>
              </Button>
            </Link>

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
                {chapters.map((chapter) => (
                  <Link key={chapter.id} to={`/chapter/${chapter.id}`} onClick={() => setSidebarOpen(false)}>
                    <div
                      className={cn(
                        "flex items-start gap-2 w-full text-left py-2 px-3 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                        location.pathname === `/chapter/${chapter.id}` && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{chapter.id}.</span>
                      <span className="break-words whitespace-normal">{chapter.title}</span>
                    </div>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </aside>

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
