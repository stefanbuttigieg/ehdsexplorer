import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { BETA_DEFAULT_KEY, BETA_TRIAL_KEY, classicDestination, isBetaEligible, readBetaChoice, shouldUseBeta, writeBetaChoice } from '@/lib/beta-experience';
import { announceBetaChoice } from '@/lib/beta-analytics';

interface BetaExperience {
  active: boolean;
  adopted: boolean;
  storageError: string | null;
  tryBeta: () => void;
  adopt: () => void;
  backToClassic: () => void;
  searchReturn: string | null;
  rememberSearch: (url: string) => void;
}
const BetaContext = createContext<BetaExperience | undefined>(undefined);

export function BetaExperienceProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isKidsMode } = useKidsMode();
  const [adopted, setAdopted] = useState(() => readBetaChoice(localStorage, BETA_DEFAULT_KEY));
  const [trial, setTrial] = useState(() => readBetaChoice(sessionStorage, BETA_TRIAL_KEY));
  const [storageError, setStorageError] = useState<string | null>(null);
  const [searchReturn, setSearchReturn] = useState<string | null>(() => {
    try { return sessionStorage.getItem('ehds-beta-search-return'); } catch { return null; }
  });
  const active = shouldUseBeta(location.pathname, isKidsMode, trial, adopted);

  useEffect(() => {
    document.documentElement.classList.toggle('beta-experience', active);
    if (active && !document.getElementById('beta-fonts')) {
      const fonts = document.createElement('link');
      fonts.id = 'beta-fonts';
      fonts.rel = 'stylesheet';
      fonts.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap';
      document.head.appendChild(fonts);
    }
    return () => document.documentElement.classList.remove('beta-experience');
  }, [active]);

  useEffect(() => {
    const sync = () => setAdopted(readBetaChoice(localStorage, BETA_DEFAULT_KEY));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // A shared entry starts only a tab-local trial; it never changes the default.
  useEffect(() => {
    if (location.pathname === '/beta' && !isKidsMode) {
      if (!trial && !adopted && !readBetaChoice(sessionStorage, BETA_TRIAL_KEY)) announceBetaChoice('trial');
      setTrial(true);
      writeBetaChoice(sessionStorage, BETA_TRIAL_KEY, true);
    }
  }, [location.pathname, isKidsMode, trial, adopted]);

  const tryBeta = () => {
    if (!isBetaEligible(location.pathname, isKidsMode)) return;
    if (!trial && !adopted) announceBetaChoice('trial');
    setTrial(true);
    writeBetaChoice(sessionStorage, BETA_TRIAL_KEY, true);
    setStorageError(null);
    if (location.pathname === '/') navigate(`/beta${location.search}${location.hash}`);
  };
  const adopt = () => {
    if (adopted || !active) return;
    const saved = writeBetaChoice(localStorage, BETA_DEFAULT_KEY, true);
    if (saved) announceBetaChoice('adopted');
    setAdopted(saved);
    setStorageError(saved ? null : 'Your browser could not save this preference.');
  };
  const backToClassic = () => {
    const saved = writeBetaChoice(localStorage, BETA_DEFAULT_KEY, false);
    if (saved && adopted) announceBetaChoice('returned_to_classic');
    writeBetaChoice(sessionStorage, BETA_TRIAL_KEY, false);
    setTrial(false);
    setAdopted(false);
    setSearchReturn(null);
    try { sessionStorage.removeItem('ehds-beta-search-return'); } catch { /* Session memory still clears. */ }
    setStorageError(saved ? null : 'Your browser could not clear this preference.');
    const destination = classicDestination(location.pathname, location.search, location.hash);
    if (destination !== `${location.pathname}${location.search}${location.hash}`) navigate(destination, { replace: true });
  };

  const rememberSearch = (url: string) => {
    if (!/^\/(?:beta|search)(?:\?|$)/.test(url)) return;
    setSearchReturn(url);
    try { sessionStorage.setItem('ehds-beta-search-return', url); } catch { /* In-memory return still works. */ }
  };
  return <BetaContext.Provider value={{ active, adopted, storageError, tryBeta, adopt, backToClassic, searchReturn, rememberSearch }}>{children}</BetaContext.Provider>;
}

export function useBetaExperience() {
  const context = useContext(BetaContext);
  if (!context) throw new Error('Beta experience requires its provider');
  return context;
}