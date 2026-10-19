import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKidsMode } from '@/contexts/KidsModeContext';
import { BETA_DEFAULT_KEY, BETA_TRIAL_KEY, classicDestination, readBetaChoice, shouldUseBeta, writeBetaChoice } from '@/lib/beta-experience';

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
  const [searchReturn, setSearchReturn] = useState<string | null>(null);
  const active = shouldUseBeta(location.pathname, isKidsMode, trial, adopted);

  useEffect(() => {
    document.documentElement.classList.toggle('beta-experience', active);
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
      setTrial(true);
      writeBetaChoice(sessionStorage, BETA_TRIAL_KEY, true);
    }
  }, [location.pathname, isKidsMode]);

  const tryBeta = () => {
    if (isKidsMode) return;
    setTrial(true);
    writeBetaChoice(sessionStorage, BETA_TRIAL_KEY, true);
    setStorageError(null);
    if (location.pathname === '/') navigate(`/beta${location.search}${location.hash}`);
  };
  const adopt = () => {
    const saved = writeBetaChoice(localStorage, BETA_DEFAULT_KEY, true);
    setAdopted(saved);
    setStorageError(saved ? null : 'Your browser could not save this preference.');
  };
  const backToClassic = () => {
    const saved = writeBetaChoice(localStorage, BETA_DEFAULT_KEY, false);
    writeBetaChoice(sessionStorage, BETA_TRIAL_KEY, false);
    setTrial(false);
    setAdopted(false);
    setSearchReturn(null);
    setStorageError(saved ? null : 'Your browser could not clear this preference.');
    const destination = classicDestination(location.pathname, location.search, location.hash);
    if (destination !== `${location.pathname}${location.search}${location.hash}`) navigate(destination, { replace: true });
  };

  return <BetaContext.Provider value={{ active, adopted, storageError, tryBeta, adopt, backToClassic, searchReturn, rememberSearch: setSearchReturn }}>{children}</BetaContext.Provider>;
}

export function useBetaExperience() {
  const context = useContext(BetaContext);
  if (!context) throw new Error('Beta experience requires its provider');
  return context;
}