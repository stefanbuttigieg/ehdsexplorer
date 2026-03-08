import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { toRoman, fromRoman } from "@/lib/romanNumerals";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  it("handles tailwind merge conflicts", () => {
    // tailwind-merge should resolve conflicts
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });
});

describe("Roman Numerals", () => {
  it("converts numbers to roman numerals", () => {
    expect(toRoman(1)).toBe("I");
    expect(toRoman(4)).toBe("IV");
    expect(toRoman(9)).toBe("IX");
    expect(toRoman(14)).toBe("XIV");
    expect(toRoman(50)).toBe("L");
  });

  it("converts roman numerals back to numbers", () => {
    expect(fromRoman("I")).toBe(1);
    expect(fromRoman("IV")).toBe(4);
    expect(fromRoman("IX")).toBe(9);
    expect(fromRoman("XIV")).toBe(14);
  });
});
