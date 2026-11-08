import { useTranslation } from "react-i18next";

/** Shown instead of the app when the first load fails, so the window is never left blank. */
export function StartupError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <main className="startup-error" role="alert">
      <div className="empty-state">
        <p className="empty-title">{t("startup.failedTitle")}</p>
        <p className="empty-text">{t("startup.failedText")}</p>
        <button type="button" className="button button-primary" onClick={onRetry}>
          {t("startup.retry")}
        </button>
      </div>
    </main>
  );
}
