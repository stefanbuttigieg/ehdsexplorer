
What I found

- The stale preview problem is very plausibly coming from the PWA/service-worker layer, not just the editor.
- `vite.config.ts` enables PWA caching globally, including page caching and long-lived backend response caching.
- `src/components/ReloadPrompt.tsx` tries to clean preview state, but it only attempts a hard reset once per session/build hash. If a tab is already running an old bundle, that one-shot guard can leave it stuck on old code.
- `index.html` still contains a hardcoded preconnect to an older backend host. That is probably not the main stale-code bug, but it should be cleaned up.
- Different preview vs published data can also be normal: preview uses the Test environment and published uses Live. Different data is expected; old frontend bundles are not.

Implementation plan

1. Make preview non-PWA by default
- Stop registering/using the service worker for preview/test usage.
- Keep PWA behavior only for the published site, or temporarily disable it completely until preview stability is restored.

2. Simplify the caching strategy
- Remove backend/runtime caching from the service worker. In an actively edited app, backend responses should not be cached this aggressively.
- Reduce or remove navigation caching for preview so HTML and JS are always fetched fresh.

3. Replace the current preview reset with a stricter cleanup flow
- Keep clearing service workers, caches, and non-auth browser storage.
- Do not mark the reset as complete until the page is no longer controlled by a service worker.
- Retry cleanup across reloads instead of relying on a single session-guarded attempt.

4. Add a visible preview freshness indicator
- Show a small preview-only badge with build hash/date and environment label.
- This makes it obvious whether the preview is on the latest bundle or stuck on an older one.

5. Remove leftover environment hints
- Replace the hardcoded old backend preconnect entries in `index.html` with the current environment-driven value, or remove them entirely.

6. Validate after implementation
- Test repeated code edits in preview.
- Reload the preview multiple times.
- Close and reopen the preview.
- Compare the preview build hash with the published build hash.
- Confirm that preview still points to Test data and published points to Live data, but both show current code.

When to raise a support ticket

- Not as the first move.
- I would raise one only if:
  - the published site consistently shows the latest code,
  - the preview still serves an older build after the cache/PWA cleanup above,
  - and a fresh session/incognito window still reproduces it.
- At that point, it is much more likely to be a platform-side preview caching issue rather than your app code.

Technical details

- `vite.config.ts`: PWA is enabled globally and currently caches navigations plus backend-origin requests.
- `src/components/ReloadPrompt.tsx`: preview cleanup is reactive and one-shot (`sessionStorage` + `__BUILD_HASH__`), which can fail if the tab is already executing an old bundle.
- `src/components/Layout.tsx`: the build hash is already rendered, so it can be reused for a clearer preview debug badge.
- `index.html`: contains stale hardcoded preconnect/dns-prefetch entries to an older backend host.

Expected outcome

- Preview should stop reviving old UI/state after refreshes.
- “Old environment” confusion should be reduced by separating true Test-vs-Live differences from actual stale frontend code.
- If the issue remains after this cleanup, we will have a much stronger case for support with clear evidence.
