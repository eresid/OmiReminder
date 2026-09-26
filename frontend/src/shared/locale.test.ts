import { describe, expect, it } from "vitest";
import { firstDayOfWeek, formattingLocale, resolveLanguage } from "./locale";

describe("locale", () => {
  it("uses the OS language when it is supported, otherwise English", () => {
    expect(resolveLanguage(["uk-UA", "en-US"])).toBe("uk");
    expect(resolveLanguage(["uk"])).toBe("uk");
    expect(resolveLanguage(["en-GB"])).toBe("en");
    expect(resolveLanguage(["de-DE", "uk-UA"])).toBe("en");
    expect(resolveLanguage([])).toBe("en");
  });

  it("formats English dates in the English system locale when there is one", () => {
    expect(formattingLocale("uk", "en-US")).toBe("uk-UA");
    expect(formattingLocale("en", "en-GB")).toBe("en-GB");
    expect(formattingLocale("en", "uk-UA")).toBe("en-US");
  });

  it("finds the first day of the week", () => {
    expect(firstDayOfWeek("uk-UA")).toBe(1);
    expect(firstDayOfWeek("en-GB")).toBe(1);
    expect(firstDayOfWeek("en-US")).toBe(7);
    expect(firstDayOfWeek("not a locale")).toBe(1);
  });
});
