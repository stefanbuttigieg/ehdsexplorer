// @ts-ignore Bun runs this focused test; browser dependencies omit Bun types.
import { describe, expect, test } from "bun:test";
import { isStaleBundleError, shouldReload } from "./staleBundleRecovery";

describe("stale bundle recovery", () => {
  test("detects missing code file after deploy", () => {
    expect(isStaleBundleError("Failed to fetch dynamically imported module: https://x/assets/ArticlePage-abc.js")).toBe(true);
    expect(isStaleBundleError("Cannot read properties of undefined")).toBe(false);
  });
  test("reloads at most once per minute", () => {
    expect(shouldReload(null, 1000)).toBe(true);
    expect(shouldReload(1000, 30_000)).toBe(false);
    expect(shouldReload(1000, 62_000)).toBe(true);
  });
});
