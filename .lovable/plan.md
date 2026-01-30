
# PWA Cache Refresh Solution

## Problem
The application is configured as a Progressive Web App (PWA) with `autoUpdate` mode. While this automatically updates the service worker in the background, users may still see cached content because:
1. The old service worker continues serving cached files until the page is fully closed and reopened
2. There's no user notification when a new version is available
3. No cache-busting headers are set on the HTML entry point

## Solution Overview
Implement a "Reload Prompt" system that detects when a new version is available and gives users the option to refresh immediately, plus add cache-control headers to ensure the browser always checks for updates.

## Changes

### 1. Update PWA Configuration (vite.config.ts)
Change `registerType` from `autoUpdate` to `prompt` so we can control when the update happens and notify users.

### 2. Add Cache-Control Meta Tags (index.html)
Add meta tags to prevent aggressive browser caching of the HTML file:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 3. Create ReloadPrompt Component
Create a new component (`src/components/ReloadPrompt.tsx`) that:
- Uses the `useRegisterSW` hook from `virtual:pwa-register/react`
- Detects when a new service worker is waiting
- Shows a toast/banner prompting the user to reload
- Handles the update and page refresh

### 4. Add PWA Virtual Module Types
Create a type declaration file (`src/pwa.d.ts`) for the virtual PWA module to ensure TypeScript compatibility.

### 5. Integrate ReloadPrompt in Layout
Add the `ReloadPrompt` component to the main Layout so it's always active.

### 6. Configure Workbox for Faster Updates
Add `skipWaiting` and `clientsClaim` options to the Workbox configuration to make the new service worker take control immediately after the user accepts the update.

## Technical Implementation

### ReloadPrompt Component Logic
```text
┌─────────────────────────────────────────┐
│          Service Worker Check           │
└─────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  New version found?   │
        └───────────────────────┘
           │              │
          Yes             No
           │              │
           ▼              ▼
┌─────────────────┐   (do nothing)
│  Show toast:    │
│  "New version   │
│   available"    │
└─────────────────┘
           │
           ▼
    User clicks "Reload"
           │
           ▼
┌─────────────────────────┐
│  updateServiceWorker()  │
│  → skipWaiting          │
│  → page.reload()        │
└─────────────────────────┘
```

## Files to Create/Modify
1. **Create** `src/pwa.d.ts` - TypeScript declarations for virtual:pwa-register
2. **Create** `src/components/ReloadPrompt.tsx` - Update notification component
3. **Modify** `vite.config.ts` - Change registerType to "prompt", add skipWaiting
4. **Modify** `index.html` - Add cache-control meta tags
5. **Modify** `src/components/Layout.tsx` - Import and render ReloadPrompt

## User Experience
When a new version is deployed:
1. User visits the site
2. Service worker checks for updates in the background
3. If a new version exists, a subtle toast appears: "A new version is available"
4. User clicks "Reload" button
5. Page refreshes with the latest version

This ensures users are always aware of updates and can get the latest version with a single click, while still benefiting from PWA caching for performance.
