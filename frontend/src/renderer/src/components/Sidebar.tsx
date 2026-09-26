import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { countAttention } from "../../../shared/grouping";
import type { View } from "../../../shared/types";
import { sortTags, tagView, useAppStore } from "../store";
import { Icon, type IconName } from "./Icon";
import { NewTagDialog } from "./TagDialogs";
import { TagDot } from "./TagDot";

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
  const tags = useAppStore((state) => state.tags);
  const language = useAppStore((state) => state.settings.language);
  const today = useAppStore((state) => state.today);
  const [creatingTag, setCreatingTag] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const counts = useMemo(() => countAttention(active, today), [active, today]);
  const todayCount = counts.overdue + counts.today;

  // Active reminders of each tag, with or without a date (FR-TAG-2). The empty key is Inbox.
  const tagCounts = useMemo(() => {
    const result = new Map<string, number>();
    for (const reminder of active) {
      for (const id of reminder.tagIds.length > 0 ? reminder.tagIds : [""]) {
        result.set(id, (result.get(id) ?? 0) + 1);
      }
    }
    return result;
  }, [active]);
  const sorted = useMemo(() => sortTags(tags, language), [tags, language]);
  const current = sorted.filter((tag) => tag.archivedAt === null);
  const archived = sorted.filter((tag) => tag.archivedAt !== null);

  function navButton(target: View, icon: ReactNode, label: string, count?: number, danger = false) {
    return (
      <button
        type="button"
        className={["nav-item", view === target ? "is-selected" : ""].join(" ")}
        aria-current={view === target ? "page" : undefined}
        title={label}
        onClick={() => {
          setView(target);
        }}
      >
        {icon}
        <span className="nav-label">{label}</span>
        {count ? <span className={["nav-count", danger ? "tone-danger" : ""].join(" ")}>{count}</span> : null}
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
      <button
        type="button"
        className="nav-item nav-add"
        onClick={() => {
          openQuickAdd();
        }}
      >
        <span className="nav-add-icon">
          <Icon name="plus" size={14} />
        </span>
        <span className="nav-label">{t("nav.addReminder")}</span>
      </button>
      <div className="nav-group">
        {NAV_ITEMS.map((item) => (
          <div key={item.view}>
            {navButton(
              item.view,
              <Icon name={item.icon} />,
              t(`nav.${item.view}`),
              item.view === "today" ? todayCount : undefined,
              item.view === "today" && counts.overdue > 0
            )}
          </div>
        ))}
      </div>

      <div className="nav-section" role="group" aria-labelledby="nav-tags-title">
        <div className="nav-section-header">
          <span id="nav-tags-title" className="nav-section-title">
            {t("nav.tags")}
          </span>
          <button
            type="button"
            className="icon-button nav-section-action"
            aria-label={t("nav.newTag")}
            title={t("nav.newTag")}
            onClick={() => {
              setCreatingTag(true);
            }}
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
        <div className="nav-group nav-scroll">
          {navButton("inbox", <Icon name="inbox" />, t("nav.inbox"), tagCounts.get(""))}
          {current.map((tag) => (
            <div key={tag.id}>
              {navButton(tagView(tag.id), <TagDot color={tag.color} />, tag.name, tagCounts.get(tag.id))}
            </div>
          ))}
          {archived.length > 0 ? (
            <>
              <button
                type="button"
                className="nav-item nav-item-muted"
                aria-expanded={showArchived}
                onClick={() => {
                  setShowArchived(!showArchived);
                }}
              >
                <Icon name="archive" />
                <span className="nav-label">{t("nav.archived")}</span>
                <Icon name={showArchived ? "chevronDown" : "chevronRight"} size={14} className="nav-chevron" />
              </button>
              {showArchived
                ? archived.map((tag) => (
                    <div key={tag.id} className="nav-archived">
                      {navButton(tagView(tag.id), <TagDot color={tag.color} />, tag.name)}
                    </div>
                  ))
                : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="nav-group nav-bottom">{navButton("settings", <Icon name="settings" />, t("nav.settings"))}</div>
      {creatingTag ? (
        <NewTagDialog
          onClose={() => {
            setCreatingTag(false);
          }}
          onCreated={(tag) => {
            setCreatingTag(false);
            setView(tagView(tag.id));
          }}
        />
      ) : null}
    </nav>
  );
}
