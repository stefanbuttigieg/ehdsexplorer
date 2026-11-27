import { expect, test } from "bun:test";
import { makeSheetName, safeCell } from "../src/lib/ia-tables-workbook";
test("sheet names are unique, max 31 chars, no illegal chars", () => {
  const used = new Set<string>();
  const a = makeSheetName("Art 15/1 [Patient] summary table with long name", used);
  const b = makeSheetName("Art 15/1 [Patient] summary table with long name", used);
  expect(a.length).toBeLessThanOrEqual(31); expect(b.length).toBeLessThanOrEqual(31);
  expect(a).not.toBe(b); expect(a).not.toMatch(/[\[\]\/]/);
});
test("formula-like cells are neutralised", () => { expect(safeCell("=SUM(A1)")).toBe("'=SUM(A1)"); expect(safeCell("ok")).toBe("ok"); });
