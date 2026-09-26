import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formattingLocale } from "../../shared/locale";
import { createDateFormatter, type DateFormatter } from "./format";
import { useAppStore } from "./store";

export function useDateFormatter(): DateFormatter {
  const { t, i18n } = useTranslation();
  const today = useAppStore((state) => state.today);
  const language = useAppStore((state) => state.settings.language);
  const systemLocale = useAppStore((state) => state.environment.systemLocale);
  return useMemo(
    () => createDateFormatter(formattingLocale(language, systemLocale), today, t),
    // `i18n.language` changes together with `t`, so the labels follow the selected language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, systemLocale, today, t, i18n.language]
  );
}
