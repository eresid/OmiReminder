import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { EMPTY_TAG_FILTER, isTagFilterActive, type HiddenCounts } from "../../../shared/tagFilter";
import { sortTags, useAppStore, type FilterScreen } from "../store";
import { Icon } from "./Icon";
import { Popover, usePopover } from "./Popover";
import { TagDot } from "./TagDot";

/** The tag filter of the main screen and "All reminders" (FR-TAG-10). */
export function TagFilterButton({ screen }: { screen: FilterScreen }) {
  const { t } = useTranslation();
  const filter = useAppStore((state) => state.filters[screen]);
  const setFilter = useAppStore((state) => state.setFilter);
  const tags = useAppStore((state) => state.tags);
  const language = useAppStore((state) => state.settings.language);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();
  const selectable = useMemo(
    () =>
      sortTags(
        tags.filter((tag) => tag.archivedAt === null),
        language
      ),
    [tags, language]
  );
  const active = isTagFilterActive(filter);

  if (selectable.length === 0 && !active) {
    return null;
  }

  const selectedNames = [
    ...(filter.untagged ? [t("filter.untagged")] : []),
    ...selectable.filter((tag) => filter.tagIds.includes(tag.id)).map((tag) => tag.name),
  ];

  function toggleTag(id: string): void {
    const tagIds = filter.tagIds.includes(id) ? filter.tagIds.filter((item) => item !== id) : [...filter.tagIds, id];
    setFilter(screen, { ...filter, tagIds });
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={["chip-button", "filter-button", active ? "is-active" : ""].join(" ")}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        aria-label={active ? `${t("filter.label")}: ${selectedNames.join(", ")}` : t("filter.label")}
        onClick={popover.toggle}
      >
        <Icon name="filter" size={15} />
        <span className="filter-button-label">{active ? selectedNames.join(", ") : t("filter.button")}</span>
      </button>
      <Popover anchorRef={anchorRef} open={popover.open} onClose={popover.close} align="end" label={t("filter.label")}>
        <div className="menu-list filter-menu" role="group" aria-label={t("filter.label")}>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={filter.untagged}
            className="menu-item"
            onClick={() => {
              setFilter(screen, { ...filter, untagged: !filter.untagged });
            }}
          >
            <Icon name="inbox" size={16} />
            <span className="menu-item-label">{t("filter.untagged")}</span>
            {filter.untagged ? <Icon name="check" size={16} className="menu-check" /> : null}
          </button>
          {selectable.map((tag) => {
            const checked = filter.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                className="menu-item"
                onClick={() => {
                  toggleTag(tag.id);
                }}
              >
                <TagDot color={tag.color} />
                <span className="menu-item-label">{tag.name}</span>
                {checked ? <Icon name="check" size={16} className="menu-check" /> : null}
              </button>
            );
          })}
          {active ? (
            <button
              type="button"
              className="menu-item menu-item-separated"
              onClick={() => {
                setFilter(screen, EMPTY_TAG_FILTER);
                popover.close();
              }}
            >
              <Icon name="close" size={16} />
              <span className="menu-item-label">{t("filter.clear")}</span>
            </button>
          ) : null}
        </div>
      </Popover>
    </>
  );
}

/** Says how many reminders the filter hides, so a filter cannot silently hide overdue ones (FR-TAG-11). */
export function HiddenNotice({ screen, counts }: { screen: FilterScreen; counts: HiddenCounts }) {
  const { t } = useTranslation();
  const active = useAppStore((state) => isTagFilterActive(state.filters[screen]));
  const setFilter = useAppStore((state) => state.setFilter);
  if (!active || counts.hidden === 0) {
    return null;
  }
  return (
    <p className={["filter-notice", counts.overdue > 0 ? "has-overdue" : ""].join(" ")} role="status">
      <span>
        {counts.overdue > 0
          ? t("filter.hiddenOverdue", { count: counts.hidden, overdue: counts.overdue })
          : t("filter.hidden", { count: counts.hidden })}
      </span>
      <button
        type="button"
        className="link-button"
        onClick={() => {
          setFilter(screen, EMPTY_TAG_FILTER);
        }}
      >
        {t("filter.clear")}
      </button>
    </p>
  );
}

/** Shown when the filter hides every reminder of the screen. */
export function FilterEmptyState({ screen }: { screen: FilterScreen }) {
  const { t } = useTranslation();
  const setFilter = useAppStore((state) => state.setFilter);
  return (
    <div className="empty-state">
      <Icon name="filter" size={22} />
      <p className="empty-title">{t("filter.emptyTitle")}</p>
      <p className="empty-text">{t("filter.emptyText")}</p>
      <button
        type="button"
        className="button"
        onClick={() => {
          setFilter(screen, EMPTY_TAG_FILTER);
        }}
      >
        {t("filter.clear")}
      </button>
    </div>
  );
}
