import { useState, useCallback, useMemo } from 'react';

/**
 * Generic hook for managing bulk selection state across admin pages.
 * Works with any item type that has a unique identifier.
 */
export function useBulkSelection<T extends string | number>(
  allItems: T[] = []
) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(allItems));
  }, [allItems]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === allItems.length && allItems.length > 0) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selected.size, allItems.length, selectAll, clearSelection]);

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);

  const isAllSelected = useMemo(
    () => allItems.length > 0 && selected.size === allItems.length,
    [allItems.length, selected.size]
  );

  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    selectedCount: selected.size,
    selectedArray,
    isSelected,
    isAllSelected,
    toggle,
    selectAll,
    clearSelection,
    toggleAll,
  };
}
