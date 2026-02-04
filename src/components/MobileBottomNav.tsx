import { Link, useLocation } from "react-router-dom";
import { Home, Book, FileText, ListChecks, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

const MobileBottomNav = ({ onMenuClick, onSearchClick }: MobileBottomNavProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/overview", icon: Book, label: "Overview" },
    { path: "/articles", icon: FileText, label: "Articles" },
    { path: "/implementing-acts", icon: ListChecks, label: "Acts" },
  ];

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
