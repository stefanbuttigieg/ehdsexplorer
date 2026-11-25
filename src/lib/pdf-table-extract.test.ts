import { describe, it, expect } from "vitest";
import { extractMarkdownTables, columnKeys } from "./pdf-table-extract";

describe("extractMarkdownTables", () => {
  it("reads headers, rows and the heading above the table", () => {
    const md = "## Annex I\n\n| Code | Name |\n| --- | --- |\n| A1 | Patient summary |\n| A2 | Images |\n\ntext";
    const [t] = extractMarkdownTables(md);
    expect(t.context).toBe("Annex I");
    expect(t.headers).toEqual(["Code", "Name"]);
    expect(t.rows).toEqual([["A1", "Patient summary"], ["A2", "Images"]]);
  });
  it("pads short rows and skips empty ones", () => {
    const md = "| A | B |\n|---|---|\n| x |\n|  |  |";
    expect(extractMarkdownTables(md)[0].rows).toEqual([["x", ""]]);
  });
  it("finds several tables", () => {
    const md = "| A |\n|---|\n| 1 |\n\n| B |\n|---|\n| 2 |";
    expect(extractMarkdownTables(md)).toHaveLength(2);
  });
});

describe("columnKeys", () => {
  it("makes unique keys", () => {
    expect(columnKeys(["Data category", "Data category", ""])).toEqual(["data_category", "data_category_2", "column_3"]);
  });
});
