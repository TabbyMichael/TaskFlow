import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDate,
  initialsOf,
  relativeTime,
} from "@/shared/utils/format";

describe("formatDate", () => {
  it("returns an em dash for nullish input", () => {
    expect(formatDate()).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("returns an em dash for unparseable dates", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO date with the default format", () => {
    // Noon UTC keeps the calendar day stable across CI timezones.
    expect(formatDate("2025-06-15T12:00:00.000Z", "yyyy-MM-dd")).toBe("2025-06-15");
  });

  it("honours a custom format string", () => {
    expect(formatDate("2025-06-15T12:00:00.000Z", "yyyy")).toBe("2025");
  });
});

describe("relativeTime", () => {
  it("returns an em dash for nullish input", () => {
    expect(relativeTime()).toBe("—");
    expect(relativeTime(null)).toBe("—");
  });

  it("returns an em dash for invalid dates", () => {
    expect(relativeTime("nope")).toBe("—");
  });

  it("describes a past instant with an 'ago' suffix", () => {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    expect(relativeTime(oneHourAgo)).toContain("ago");
  });
});

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [1024 ** 2, "1.0 MB"],
    [1.5 * 1024 ** 2, "1.5 MB"],
  ])("formats %i bytes as %s", (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });
});

describe("initialsOf", () => {
  it("takes the first letter of the first two words, uppercased", () => {
    expect(initialsOf("Alex Morgan")).toBe("AM");
    expect(initialsOf("sam o'connor")).toBe("SO");
  });

  it("handles single-word names", () => {
    expect(initialsOf("Cher")).toBe("C");
  });

  it("caps at two initials", () => {
    expect(initialsOf("a b c d")).toBe("AB");
  });
});
