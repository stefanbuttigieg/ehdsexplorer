export type BetaChoice = 'trial' | 'adopted' | 'returned_to_classic';
export const BETA_CHOICE_EVENT = 'ehds-beta-choice';

export function betaEventName(choice: unknown): string | null {
  switch (choice) {
    case 'trial': return 'beta_trial_started';
    case 'adopted': return 'beta_default_adopted';
    case 'returned_to_classic': return 'beta_returned_to_classic';
    default: return null;
  }
}

export function canTrackBeta(consent: boolean, initialized: boolean, hostname: string, embedded: boolean): boolean {
  return consent && initialized && !embedded && ['ehdsexplorer.eu', 'www.ehdsexplorer.eu', 'ehdsexplorer.lovable.app'].includes(hostname);
}

// Only the existing analytics provider sends events, after its consent checks.
export function announceBetaChoice(choice: BetaChoice) {
  window.dispatchEvent(new CustomEvent(BETA_CHOICE_EVENT, { detail: { choice } }));
}