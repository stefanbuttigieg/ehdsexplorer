import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSidebarItems } from "@/hooks/useSidebarItems";

interface KidsModeContextType {
  isKidsMode: boolean;
  toggleKidsMode: () => void;
  isKidsFriendlyRoute: (path: string) => boolean;
  kidsFriendlyPaths: Set<string>;
}

const KidsModeContext = createContext<KidsModeContextType | undefined>(undefined);

// Static fallback used before DB loads
const FALLBACK_KIDS_PATHS = new Set([
  "/", "/kids", "/games", "/match-game", "/flashcards", "/quiz",
  "/word-search", "/true-false", "/who-am-i", "/for/citizens",
  "/help", "/privacy-policy", "/cookies-policy", "/terms-of-service", "/accessibility",
]);

export const isKidsFriendlyRoute = (path: string) => FALLBACK_KIDS_PATHS.has(path);

export const KidsModeProvider = ({ children }: { children: ReactNode }) => {
  const [isKidsMode, setIsKidsMode] = useState(() => {
    return localStorage.getItem("ehds-kids-mode") === "true";
  });

  const { data: sidebarItems } = useSidebarItems();

  const kidsFriendlyPaths = sidebarItems && sidebarItems.length > 0
    ? new Set(sidebarItems.filter(i => i.show_in_kids_mode).map(i => i.path))
    : FALLBACK_KIDS_PATHS;

  const checkKidsFriendly = (path: string) => kidsFriendlyPaths.has(path);

  useEffect(() => {
    localStorage.setItem("ehds-kids-mode", String(isKidsMode));
    if (isKidsMode) {
      document.documentElement.classList.add("kids-mode");
    } else {
      document.documentElement.classList.remove("kids-mode");
    }
  }, [isKidsMode]);

  useEffect(() => {
    if (localStorage.getItem("ehds-kids-mode") === "true") {
      document.documentElement.classList.add("kids-mode");
    }
  }, []);

  const toggleKidsMode = () => setIsKidsMode((prev) => !prev);

  return (
    <KidsModeContext.Provider value={{ isKidsMode, toggleKidsMode, isKidsFriendlyRoute: checkKidsFriendly, kidsFriendlyPaths }}>
      {children}
    </KidsModeContext.Provider>
  );
};

export const useKidsMode = () => {
  const context = useContext(KidsModeContext);
  if (!context) throw new Error("useKidsMode must be used within KidsModeProvider");
  return context;
};
