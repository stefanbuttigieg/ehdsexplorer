import { useState, useEffect, useCallback } from "react";

export type FontSize = "small" | "medium" | "large" | "x-large";

const fontSizeMap: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
  "x-large": "20px",
};

const fontSizeLabels: Record<FontSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  "x-large": "Extra Large",
};

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const stored = localStorage.getItem("ehds-font-size");
    return (stored as FontSize) || "medium";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--base-font-size", fontSizeMap[fontSize]);
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  const setFontSize = useCallback((size: FontSize) => {
    localStorage.setItem("ehds-font-size", size);
    setFontSizeState(size);
  }, []);

  const increaseFontSize = useCallback(() => {
    const sizes: FontSize[] = ["small", "medium", "large", "x-large"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  }, [fontSize, setFontSize]);

  const decreaseFontSize = useCallback(() => {
    const sizes: FontSize[] = ["small", "medium", "large", "x-large"];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  }, [fontSize, setFontSize]);

  return {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    fontSizeLabel: fontSizeLabels[fontSize],
    fontSizeValue: fontSizeMap[fontSize],
  };
}
