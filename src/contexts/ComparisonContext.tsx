import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type ComparisonItemType = "article" | "recital" | "implementing-act";

export interface ComparisonItem {
  id: string;
  type: ComparisonItemType;
  title: string;
  number?: number;
}

interface ComparisonContextType {
  items: ComparisonItem[];
  addItem: (item: ComparisonItem) => void;
  removeItem: (id: string, type: ComparisonItemType) => void;
  clearItems: () => void;
  isInComparison: (id: string, type: ComparisonItemType) => boolean;
  toggleItem: (item: ComparisonItem) => void;
  canAddMore: boolean;
  itemCount: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = "ehds-comparison-items";
const MAX_ITEMS = 4;

export const ComparisonProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ComparisonItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: ComparisonItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id && i.type === item.type);
      if (exists) return prev;
      if (prev.length >= MAX_ITEMS) {
        return [...prev.slice(1), item];
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string, type: ComparisonItemType) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  const isInComparison = useCallback(
    (id: string, type: ComparisonItemType) => {
      return items.some((i) => i.id === id && i.type === type);
    },
    [items]
  );

  const toggleItem = useCallback(
    (item: ComparisonItem) => {
      if (isInComparison(item.id, item.type)) {
        removeItem(item.id, item.type);
      } else {
        addItem(item);
      }
    },
    [isInComparison, removeItem, addItem]
  );

  return (
    <ComparisonContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearItems,
        isInComparison,
        toggleItem,
        canAddMore: items.length < MAX_ITEMS,
        itemCount: items.length,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
};
