// @ts-ignore Bun runs these focused tests independently of the Vite test runner.
import { beforeEach, expect, it, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
import React from 'react';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:8080/admin/auth' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, navigator: dom.window.navigator, sessionStorage: dom.window.sessionStorage, Event: dom.window.Event, HTMLElement: dom.window.HTMLElement });
Object.assign(globalThis, { getComputedStyle: dom.window.getComputedStyle.bind(dom.window), requestAnimationFrame: (fn: FrameRequestCallback) => setTimeout(fn, 0), cancelAnimationFrame: clearTimeout });
let verified = false;
let role = 'admin';
let selected = '';
const user = { id: 'test-user', email: 'test@example.com' };
const client = {
  auth: {
    getSession: async () => ({ data: { session: { user } } }),
    getUser: async () => ({ data: { user } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    mfa: { listFactors: async () => ({ data: { totp: [{ id: 'factor', status: 'verified' }] } }) },
  },
  rpc: async () => ({ data: verified }),
  from: (table: string) => {
    const query = {
      select: (columns: string) => { selected = columns; return query; },
      eq: async () => ({ data: [{ role }] }),
    };
    if (table === 'user_roles') return query;
    const prefs = {
      select: (columns: string) => { selected = columns; return prefs; },
      eq: () => prefs,
      maybeSingle: async () => ({ data: { email_otp_enabled: true } }),
      single: async () => selected === '*' || !selected ? ({ error: new Error('permission denied') }) : ({ data: { user_id: user.id } }),
      upsert: () => prefs,
      update: () => prefs,
      insert: () => prefs,
    };
    return prefs;
  },
};
mock.module('@/integrations/supabase/client', () => ({ supabase: client }));
mock.module('@/hooks/use-toast', () => ({ useToast: () => ({ toast() {} }) }));
mock.module('@/components/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
mock.module('@/components/mfa/LoginMFAVerifyDialog', () => ({ LoginMFAVerifyDialog: ({ open, onSuccess }: { open: boolean; onSuccess: () => void }) => open ? <button onClick={() => { verified = true; onSuccess(); }}>Complete verification</button> : null }));
const { render, renderHook, waitFor, act, cleanup, fireEvent } = await import('@testing-library/react');
const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
const { MemoryRouter, Routes, Route } = await import('react-router-dom');
const { useMFAEnrollment } = await import('../hooks/useMFAEnrollment');
const { default: AdminAuthPage } = await import('../pages/AdminAuthPage');

beforeEach(() => { cleanup(); verified = false; selected = ''; role = 'admin'; });

it('dismiss and snooze return only preference columns the caller may read', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { result } = renderHook(() => useMFAEnrollment(), { wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider> });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => { await result.current.dismissReminder(); });
  expect(selected).toBe('id,user_id,reminder_dismissed_at,reminder_snooze_until,preferred_method,email_otp_enabled,created_at,updated_at');
  await act(async () => { await result.current.snoozeReminder(); });
  expect(selected.split(',')).not.toContain('email_otp_code');
});

for (const accountRole of ['editor', 'admin', 'super_admin', 'reader']) {
  it(`waits for refreshed verification and sends ${accountRole} to the correct page`, async () => {
    role = accountRole;
    const view = render(<MemoryRouter initialEntries={['/admin/auth']}><Routes><Route path="/admin/auth" element={<AdminAuthPage />} /><Route path="/admin" element={<p>Admin destination</p>} /><Route path="/" element={<p>Public destination</p>} /></Routes></MemoryRouter>);
    const verify = await view.findByText('Complete verification');
    expect(view.queryByText('Public destination')).toBeNull();
    fireEvent.click(verify);
    await view.findByText(accountRole === 'reader' ? 'Public destination' : 'Admin destination');
  });
}