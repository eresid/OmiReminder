import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { Icon } from "./Icon";

const TOAST_DURATION_MS = 6000;

/** A short message with an optional Undo action (FR-MAIN-7, FR-MAIN-8). */
export function ToastHost() {
  const { t } = useTranslation();
  const toast = useAppStore((state) => state.toast);
  const dismiss = useAppStore((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(dismiss, TOAST_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast, dismiss]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast ? (
        <div className="toast" key={toast.id}>
          <span className="toast-message">{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                const undo = toast.undo;
                dismiss();
                void undo?.();
              }}
            >
              {t("toast.undo")}
            </button>
          ) : null}
          <button type="button" className="toast-close" aria-label={t("toast.close")} onClick={dismiss}>
            <Icon name="close" size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
