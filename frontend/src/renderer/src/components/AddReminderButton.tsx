import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { Icon } from "./Icon";

/** Floating action button that opens quick-add; on a tag page the tag is preset (FR-TAG-5). */
export function AddReminderButton() {
  const { t } = useTranslation();
  const openQuickAdd = useAppStore((state) => state.openQuickAdd);
  return (
    <button
      type="button"
      className="fab"
      aria-label={t("nav.addReminder")}
      title={t("nav.addReminder")}
      onClick={() => {
        openQuickAdd();
      }}
    >
      <Icon name="plus" size={24} />
    </button>
  );
}
