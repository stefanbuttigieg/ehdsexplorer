export const BETA_DEFAULT_KEY = 'ehds-beta-default';
export const BETA_TRIAL_KEY = 'ehds-beta-trial';

type BrowserStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readBetaChoice(store: BrowserStore, key: string): boolean {
  try { return store.getItem(key) === 'true'; } catch { return false; }
}

export function writeBetaChoice(store: BrowserStore, key: string, enabled: boolean): boolean {
  try {
    if (enabled) store.setItem(key, 'true'); else store.removeItem(key);
    return true;
  } catch { return false; }
}

export function isBetaEligible(pathname: string, kidsMode: boolean): boolean {
  if (kidsMode) return false;
  return !/^\/(?:admin|kids|profile|my-countries|unsubscribe|verify-subscription|manage-subscription|\.lovable|oauth|auth)(?:\/|$)/.test(pathname);
}

export function shouldUseBeta(pathname: string, kidsMode: boolean, trial: boolean, adopted: boolean): boolean {
  return isBetaEligible(pathname, kidsMode) && (pathname === '/beta' || trial || adopted);
}

export function classicDestination(pathname: string, search: string, hash: string): string {
  if (pathname === '/beta') return `${new URLSearchParams(search).has('q') ? '/search' : '/'}${search}${hash}`;
  return `${pathname}${search}${hash}`;
}