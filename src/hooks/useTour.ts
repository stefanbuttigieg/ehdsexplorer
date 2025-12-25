import { useState, useEffect } from 'react';

const TOUR_STORAGE_KEY = 'ehds-tour-completed';
const ADMIN_TOUR_STORAGE_KEY = 'ehds-admin-tour-completed';

export const useTour = (tourType: 'public' | 'admin' = 'public') => {
  const storageKey = tourType === 'admin' ? ADMIN_TOUR_STORAGE_KEY : TOUR_STORAGE_KEY;
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey) === 'true';
    setHasSeenTour(seen);
  }, [storageKey]);

  const completeTour = () => {
    localStorage.setItem(storageKey, 'true');
    setHasSeenTour(true);
    setIsTourOpen(false);
  };

  const startTour = () => {
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const resetTour = () => {
    localStorage.removeItem(storageKey);
    setHasSeenTour(false);
  };

  return {
    hasSeenTour,
    isTourOpen,
    startTour,
    closeTour,
    completeTour,
    resetTour,
  };
};
