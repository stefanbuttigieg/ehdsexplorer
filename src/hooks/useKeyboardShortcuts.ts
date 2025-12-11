import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface ShortcutHandlers {
  onBookmark?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Extract article ID from current path
      const articleMatch = location.pathname.match(/\/article\/(\d+)/);
      const currentArticleId = articleMatch ? parseInt(articleMatch[1]) : null;

      switch (event.key) {
        case "ArrowLeft":
        case "j":
          if (currentArticleId && currentArticleId > 1) {
            navigate(`/article/${currentArticleId - 1}`);
          }
          break;

        case "ArrowRight":
        case "k":
          if (currentArticleId && currentArticleId < 99) {
            navigate(`/article/${currentArticleId + 1}`);
          }
          break;

        case "b":
          if (handlers.onBookmark) {
            handlers.onBookmark();
          }
          break;

        case "/":
        case "s":
          event.preventDefault();
          if (handlers.onSearch) {
            handlers.onSearch();
          } else {
            const searchInput = document.querySelector(
              'input[type="search"]'
            ) as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            } else {
              navigate("/search");
            }
          }
          break;

        case "?":
          if (handlers.onHelp) {
            handlers.onHelp();
          }
          break;

        case "h":
          navigate("/");
          break;

        case "Escape":
          (document.activeElement as HTMLElement)?.blur();
          break;
      }
    },
    [navigate, location.pathname, handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export const shortcuts = [
  { key: "←/j", description: "Previous article" },
  { key: "→/k", description: "Next article" },
  { key: "b", description: "Toggle bookmark" },
  { key: "/ or s", description: "Focus search" },
  { key: "h", description: "Go home" },
  { key: "?", description: "Show shortcuts" },
  { key: "Esc", description: "Unfocus input" },
];
