import i18next from "i18next";
import { beforeAll, describe, expect, it } from "vitest";
import { translationResources } from "../../shared/i18n";
import { createDateFormatter } from "./format";

describe("date formatter", () => {
  beforeAll(async () => {
    await i18next.init({ resources: translationResources, lng: "en", fallbackLng: "en" });
  });

  it("uses relative labels near today", () => {
    const format = createDateFormatter("en-GB", "2026-09-25", i18next.t);
    expect(format.dayLabel("2026-09-25")).toBe("Today");
    expect(format.dayLabel("2026-09-26")).toBe("Tomorrow");
    expect(format.dayLabel("2026-09-24")).toBe("Yesterday");
    expect(format.dayLabel("2026-09-28")).toBe("Monday");
    expect(format.dayLabel("2026-10-05")).toBe("Mon 5 Oct");
    expect(format.dayLabel("2027-01-04")).toBe("Mon, 4 Jan 2027");
  });

  it("formats headings in the selected locale without shifting the date", () => {
    expect(createDateFormatter("en-GB", "2026-09-25", i18next.t).dayHeading("2026-09-28")).toBe("Monday 28 September");
    expect(createDateFormatter("uk-UA", "2026-09-25", i18next.t).dayHeading("2026-09-28")).toBe(
      "Понеділок, 28 вересня"
    );
  });
});
