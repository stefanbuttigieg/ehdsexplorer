import { createRoot } from "react-dom/client"; 
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// --- Preview / iframe SW guard ---
// Prevent service workers from caching stale bundles inside Lovable's
// preview iframe.  This runs *before* React mounts so ReloadPrompt never
// even registers a SW in preview contexts.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin → assume iframe
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  // Nuke any previously-registered service workers
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  // Clear all caches so no stale assets survive
  caches?.keys().then((keys) => {
    keys.forEach((k) => caches.delete(k));
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
