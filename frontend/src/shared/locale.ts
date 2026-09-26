import type { Language } from "./types";

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "uk";
}

/** The OS language if it is supported, otherwise English (FR-L10N-2). */
export function resolveLanguage(preferredLanguages: readonly string[]): Language {
  const primary = preferredLanguages[0]?.toLowerCase() ?? "";
  return primary.startsWith("uk") ? "uk" : "en";
}

/** The locale used to format dates in the selected UI language (FR-L10N-4). */
export function formattingLocale(language: Language, systemLocale: string): string {
  if (language === "uk") {
    return "uk-UA";
  }
  return systemLocale.toLowerCase().startsWith("en") ? systemLocale : "en-US";
}

// Regions where the week starts on Sunday. Used when the runtime has no week data.
const SUNDAY_FIRST_REGIONS = new Set([
  "AG",
  "AS",
  "BD",
  "BR",
  "BS",
  "BT",
  "BW",
  "BZ",
  "CA",
  "CN",
  "CO",
  "DM",
  "DO",
  "ET",
  "GT",
  "GU",
  "HK",
  "HN",
  "ID",
  "IL",
  "IN",
  "JM",
  "JP",
  "KE",
  "KH",
  "KR",
  "LA",
  "MH",
  "MM",
  "MO",
  "MT",
  "MX",
  "MZ",
  "NI",
  "NP",
  "PA",
  "PE",
  "PH",
  "PK",
  "PR",
  "PT",
  "PY",
  "SA",
  "SG",
  "SV",
  "TH",
  "TT",
  "TW",
  "UM",
  "US",
  "VE",
  "VI",
  "WS",
  "YE",
  "ZA",
  "ZW",
]);

interface LocaleWithWeekInfo {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

/** ISO weekday on which the week starts in the locale: 1 is Monday, 7 is Sunday. */
export function firstDayOfWeek(locale: string): number {
  try {
    const intlLocale = new Intl.Locale(locale);
    const withWeekInfo = intlLocale as unknown as LocaleWithWeekInfo;
    const firstDay = withWeekInfo.getWeekInfo?.().firstDay ?? withWeekInfo.weekInfo?.firstDay;
    if (typeof firstDay === "number" && firstDay >= 1 && firstDay <= 7) {
      return firstDay;
    }
    const region = intlLocale.maximize().region;
    return region !== undefined && SUNDAY_FIRST_REGIONS.has(region) ? 7 : 1;
  } catch {
    return 1;
  }
}
