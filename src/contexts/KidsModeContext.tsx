import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface KidsModeContextType {
  isKidsMode: boolean;
  toggleKidsMode: () => void;
  isKidsFriendlyRoute: (path: string) => boolean;
}

const KidsModeContext = createContext<KidsModeContextType | undefined>(undefined);

// Routes accessible in Kids Mode
const KIDS_FRIENDLY_PATHS = new Set([
  "/",
  "/kids",
  "/games",
  "/match-game",
  "/flashcards",
  "/quiz",
  "/word-search",
  "/true-false",
  "/who-am-i",
  "/for/citizens",
  "/help",
  "/privacy-policy",
  "/cookies-policy",
  "/terms-of-service",
  "/accessibility",
]);

export const isKidsFriendlyRoute = (path: string) => KIDS_FRIENDLY_PATHS.has(path);

export const KidsModeProvider = ({ children }: { children: ReactNode }) => {
  const [isKidsMode, setIsKidsMode] = useState(() => {
    return localStorage.getItem("ehds-kids-mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("ehds-kids-mode", String(isKidsMode));
    // Toggle the kids-mode CSS class on the root element
    if (isKidsMode) {
      document.documentElement.classList.add("kids-mode");
    } else {
      document.documentElement.classList.remove("kids-mode");
    }
  }, [isKidsMode]);

  // Also apply on mount in case of page refresh
  useEffect(() => {
    if (localStorage.getItem("ehds-kids-mode") === "true") {
      document.documentElement.classList.add("kids-mode");
    }
  }, []);

  const toggleKidsMode = () => setIsKidsMode((prev) => !prev);

  return (
    <KidsModeContext.Provider value={{ isKidsMode, toggleKidsMode, isKidsFriendlyRoute }}>
      {children}
    </KidsModeContext.Provider>
  );
};

export const useKidsMode = () => {
  const context = useContext(KidsModeContext);
  if (!context) throw new Error("useKidsMode must be used within KidsModeProvider");
  return context;
};
