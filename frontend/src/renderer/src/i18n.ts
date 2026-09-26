import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { translationResources } from "../../shared/i18n";
import type { Language } from "../../shared/types";

export function initI18n(language: Language): void {
  void i18next.use(initReactI18next).init({
    resources: translationResources,
    lng: language,
    fallbackLng: "en",
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  document.documentElement.lang = language;
}

export async function changeLanguage(language: Language): Promise<void> {
  await i18next.changeLanguage(language);
  document.documentElement.lang = language;
}

export { i18next };
