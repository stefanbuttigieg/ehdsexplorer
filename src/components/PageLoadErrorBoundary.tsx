import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { recoverFromStaleBundle } from "@/lib/staleBundleRecovery";

// Catches pages that fail to load (e.g. after a site update) so the screen is never blank.
export class PageLoadErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("Page failed to load", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">This page couldn't load</h1>
        <p className="max-w-md text-muted-foreground">The site may have just been updated. Reloading usually fixes it.</p>
        <Button onClick={() => void recoverFromStaleBundle()}>Reload page</Button>
      </div>
    );
  }
}
