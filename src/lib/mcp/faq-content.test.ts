// @ts-ignore Bun runs this focused test; browser dependencies omit Bun types.
import { describe, expect, it } from "bun:test";
import { faqAnswer } from "./faq-content";

describe("MCP FAQ answers", () => {
  it("returns FAQ 43's existing Article 71 answer when the legacy answer is empty", () => {
    const answer = "Yes, you can. Article 71 of the EHDS Regulation grants you a right to opt out from secondary use.";
    expect(faqAnswer({ answer: "", rich_content: answer })).toBe(answer);
  });

  it("prefers published rich content over a legacy answer", () => {
    expect(faqAnswer({ answer: "Legacy answer", rich_content: "Current answer" })).toBe("Current answer");
  });

  it("keeps legacy answers when rich content is blank", () => {
    expect(faqAnswer({ answer: "Legacy answer", rich_content: "  " })).toBe("Legacy answer");
  });
});