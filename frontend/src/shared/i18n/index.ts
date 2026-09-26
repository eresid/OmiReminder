import type { Resource } from "i18next";
import { en } from "./en";
import { uk } from "./uk";

export const translationResources = {
  en: { translation: en },
  uk: { translation: uk },
} satisfies Resource;
