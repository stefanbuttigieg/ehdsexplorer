import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostHogProvider from '@/components/PostHogProvider';

const analytics = vi.hoisted(() => ({
  optedIn: false,
  init: vi.fn(),
  optIn: vi.fn(),
  optOut: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    init: analytics.init,
    has_opted_in_capturing: () => analytics.optedIn,
    opt_in_capturing: analytics.optIn,
    opt_out_capturing: analytics.optOut,
    capture: vi.fn(),
    register: vi.fn(),
  },
}));

const setConsent = (enabled: boolean) => {
  localStorage.setItem('ehds-cookie-preferences', JSON.stringify({ analytics: enabled }));
};

const mountProvider = () => render(<MemoryRouter><PostHogProvider /></MemoryRouter>);

describe('PostHog consent opt-in', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    analytics.optedIn = false;
    analytics.optIn.mockImplementation(() => { analytics.optedIn = true; });
    analytics.optOut.mockImplementation(() => { analytics.optedIn = false; });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('does not opt in again when PostHog already has consent', () => {
    setConsent(true);
    analytics.optedIn = true;
    mountProvider();
    expect(analytics.optIn).toHaveBeenCalledTimes(0);
  });

  it('opts in once across repeated preference events and remounts', () => {
    setConsent(true);
    const view = mountProvider();
    act(() => {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('cookie-preferences-updated'));
      vi.advanceTimersByTime(100);
    });
    view.unmount();
    mountProvider();
    expect(analytics.optIn).toHaveBeenCalledTimes(1);
  });

  it('respects rejection and allows opt-in again only after consent is restored', () => {
    setConsent(false);
    mountProvider();
    expect(analytics.optIn).toHaveBeenCalledTimes(0);
    act(() => {
      setConsent(true);
      window.dispatchEvent(new Event('storage'));
    });
    expect(analytics.optIn).toHaveBeenCalledTimes(1);
    act(() => {
      setConsent(false);
      window.dispatchEvent(new Event('storage'));
    });
    expect(analytics.optedIn).toBe(false);
    act(() => {
      setConsent(true);
      window.dispatchEvent(new Event('storage'));
    });
    expect(analytics.optIn).toHaveBeenCalledTimes(2);
  });
});