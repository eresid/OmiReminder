import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { countAttention } from "../../../shared/grouping";
import type { View } from "../../../shared/types";
import { useAppStore } from "../store";
import { Icon, type IconName } from "./Icon";

const NAV_ITEMS: readonly { view: View; icon: IconName }[] = [
  { view: "today", icon: "today" },
  { view: "all", icon: "list" },
];

export function Sidebar() {
  const { t } = useTranslation();
  const view = useAppStore((state) => state.view);
  const setView = useAppStore((state) => state.setView);
  const openQuickAdd = useAppStore((state) => state.openQuickAdd);
  const active = useAppStore((state) => state.active);
  const today = useAppStore((state) => state.today);
  const counts = useMemo(() => countAttention(active, today), [active, today]);
  const todayCount = counts.overdue + counts.today;

  function navButton(target: View, icon: IconName, label: string, count?: number) {
    return (
      <button
        type="button"
        className={["nav-item", view === target ? "is-selected" : ""].join(" ")}
        aria-current={view === target ? "page" : undefined}
        onClick={() => {
          setView(target);
        }}
      >
        <Icon name={icon} />
        <span className="nav-label">{label}</span>
        {count ? (
          <span className={["nav-count", counts.overdue > 0 ? "tone-danger" : ""].join(" ")}>{count}</span>
        ) : null}
      </button>
    );
  }

  return (
    <nav className="sidebar" aria-label="OmiReminder">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        OmiReminder
      </div>
      <button type="button" className="nav-item nav-add" onClick={openQuickAdd}>
        <span className="nav-add-icon">
          <Icon name="plus" size={14} />
        </span>
        <span className="nav-label">{t("nav.addReminder")}</span>
      </button>
      <div className="nav-group">
        {NAV_ITEMS.map((item) => (
          <div key={item.view}>
            {navButton(item.view, item.icon, t(`nav.${item.view}`), item.view === "today" ? todayCount : undefined)}
          </div>
        ))}
      </div>
      <div className="nav-group nav-bottom">{navButton("settings", "settings", t("nav.settings"))}</div>
    </nav>
  );
}
