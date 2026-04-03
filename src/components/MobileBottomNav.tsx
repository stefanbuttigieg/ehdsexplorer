import { Link, useLocation } from "react-router-dom";
import { Home, Book, FileText, ListChecks, Search, Menu, Heart, Brain, Scale, Files, Globe, Network, GitCompare, Laptop, Stethoscope, Wrench, Sparkles, Newspaper, MessageCircleQuestion, Bookmark, StickyNote, Trophy, Medal, HelpCircle, Code, Shield, Cookie, ScrollText, Accessibility, Users, Settings, MapPin, BookOpen, Layers, ExternalLink, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKidsMode } from "@/contexts/KidsModeContext";
import { useSidebarItems } from "@/hooks/useSidebarItems";

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Book, FileText, Scale, Files, ListChecks, Globe, Network, GitCompare,
  Heart, Laptop, Stethoscope, Wrench, Sparkles, Newspaper, MessageCircleQuestion,
  Bookmark, StickyNote, Trophy, Medal, Brain, HelpCircle, Code, Shield, Cookie,
  ScrollText, Accessibility, Users, Settings, MapPin, BookOpen, Layers, ExternalLink,
  Search, Menu,
};

interface MobileBottomNavProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

const MobileBottomNav = ({ onMenuClick, onSearchClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const { isKidsMode } = useKidsMode();
  const { data: sidebarItems } = useSidebarItems();
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Fallback items if DB hasn't loaded
  const fallbackDefault = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/overview", icon: Book, label: "Overview" },
    { path: "/articles", icon: FileText, label: "Articles" },
    { path: "/implementing-acts", icon: ListChecks, label: "Acts" },
  ];

  const fallbackKids = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/kids", icon: Heart, label: "Kids" },
    { path: "/games", icon: Brain, label: "Games" },
  ];

  // Build nav items from DB
  const dbMobileItems = sidebarItems
    ?.filter(i => i.show_in_mobile_nav)
    .sort((a, b) => a.mobile_sort_order - b.mobile_sort_order)
    .map(i => ({ path: i.path, icon: ICON_MAP[i.icon_name] || FileText, label: i.label })) || [];

  const dbKidsItems = sidebarItems
    ?.filter(i => i.show_in_mobile_nav && i.show_in_kids_mode)
    .sort((a, b) => a.mobile_sort_order - b.mobile_sort_order)
    .map(i => ({ path: i.path, icon: ICON_MAP[i.icon_name] || FileText, label: i.label })) || [];

  const navItems = isKidsMode
    ? (dbKidsItems.length > 0 ? dbKidsItems : fallbackKids)
    : (dbMobileItems.length > 0 ? dbMobileItems : fallbackDefault);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs transition-colors",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5",
              isActive(item.path) && "text-primary"
            )} />
            <span className="truncate max-w-[60px]">{item.label}</span>
          </Link>
        ))}
        
        {/* Search Button */}
        <button
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>

        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
