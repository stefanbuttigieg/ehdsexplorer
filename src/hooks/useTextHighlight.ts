import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

export const useTextHighlight = () => {
  const location = useLocation();
  const [highlightedText, setHighlightedText] = useState<string | null>(null);

  // Extract highlighted text from URL hash
  useEffect(() => {
    const hash = location.hash;
    if (hash.includes(":~:text=")) {
      const textMatch = hash.match(/:~:text=([^&]+)/);
      if (textMatch) {
        const decodedText = decodeURIComponent(textMatch[1]);
        setHighlightedText(decodedText);
        
        // Wait for content to render, then scroll to and highlight the text
        setTimeout(() => {
          highlightAndScrollToText(decodedText);
        }, 500);
      }
    } else {
      setHighlightedText(null);
    }
  }, [location.hash]);

  const highlightAndScrollToText = (text: string) => {
    // Find text in the page
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      if (node.textContent?.toLowerCase().includes(text.toLowerCase())) {
        const parent = node.parentElement;
        if (parent && !parent.closest("[data-text-highlight]")) {
          const content = node.textContent;
          const index = content.toLowerCase().indexOf(text.toLowerCase());
          const matchedText = content.substring(index, index + text.length);
          
          // Create highlighted span
          const before = document.createTextNode(content.substring(0, index));
          const highlighted = document.createElement("mark");
          highlighted.setAttribute("data-text-highlight", "true");
          highlighted.className = "bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded animate-pulse";
          highlighted.textContent = matchedText;
          const after = document.createTextNode(content.substring(index + text.length));
          
          const fragment = document.createDocumentFragment();
          fragment.appendChild(before);
          fragment.appendChild(highlighted);
          fragment.appendChild(after);
          
          node.replaceWith(fragment);
          
          // Scroll to highlighted element
          highlighted.scrollIntoView({ behavior: "smooth", block: "center" });
          
          // Remove pulse animation after 3 seconds
          setTimeout(() => {
            highlighted.classList.remove("animate-pulse");
          }, 3000);
          
          return;
        }
      }
    }
  };

  const createShareLink = useCallback((selectedText: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const encodedText = encodeURIComponent(selectedText);
    return `${baseUrl}#:~:text=${encodedText}`;
  }, []);

  const copyShareLink = useCallback(async (selectedText: string) => {
    const link = createShareLink(selectedText);
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error("Failed to copy link:", err);
      return false;
    }
  }, [createShareLink]);

  return {
    highlightedText,
    createShareLink,
    copyShareLink,
  };
};
