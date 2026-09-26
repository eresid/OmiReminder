import i18next, { type i18n } from "i18next";
import { translationResources } from "../shared/i18n";
import type { Language } from "../shared/types";

/** Translations for strings shown by the main process: tray, notifications. */
export function createMainI18n(language: Language): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    resources: translationResources,
    lng: language,
    fallbackLng: "en",
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
