// After a deploy, open tabs may request code files that no longer exist.
// Detect that once, clear cached files and reload; a time guard prevents loops.
const KEY = "ehds-stale-reload-at";
const GUARD_MS = 60_000;

export function isStaleBundleError(message: string): boolean {
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading (CSS )?chunk .* failed|Unable to preload CSS/i.test(message);
}

export function shouldReload(lastReloadAt: number | null, now: number): boolean {
  return lastReloadAt === null || now - lastReloadAt > GUARD_MS;
}

function claimReload(): boolean {
  let last: number | null = null;
  try { last = Number(sessionStorage.getItem(KEY)) || null; } catch { /* storage blocked */ }
  if (!shouldReload(last, Date.now())) return false;
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { return false; }
  return true;
}

async function recover() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
    const keys = (await globalThis.caches?.keys()) ?? [];
    await Promise.all(keys.filter((k) => k.includes("precache")).map((k) => caches.delete(k)));
  } catch { /* still reload */ }
  window.location.reload();
}

export function installStaleBundleRecovery() {
  window.addEventListener("vite:preloadError", (e) => {
    // Only swallow the error when we really reload; otherwise let it surface.
    if (!claimReload()) return;
    e.preventDefault();
    void recover();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as Error | undefined)?.message ?? e.reason ?? "");
    if (isStaleBundleError(msg) && claimReload()) void recover();
  });
  window.addEventListener("error", (e) => {
    if (isStaleBundleError(String(e.message ?? "")) && claimReload()) void recover();
  });
}

export { recover as recoverFromStaleBundle };
