import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { groupForTagPage } from "../../../shared/grouping";
import { remindersOfTag } from "../../../shared/tagFilter";
import { TAG_COLORS, type Tag } from "../../../shared/types";
import { hasRelativeLabel } from "../format";
import { useDateFormatter } from "../hooks";
import { useAppStore } from "../store";
import { Icon } from "./Icon";
import { Popover, usePopover } from "./Popover";
import { ReminderRow } from "./ReminderRow";
import { DeleteTagDialog, TagNameDialog } from "./TagDialogs";
import { TagDot } from "./TagDot";
import { AddReminderRow } from "./TodayView";

type TagDialog = "rename" | "delete" | null;

/** Rename, color, archive, and delete (FR-TAG-6 to FR-TAG-8). */
function TagMenu({ tag, onOpenDialog }: { tag: Tag; onOpenDialog: (dialog: TagDialog) => void }) {
  const { t } = useTranslation();
  const updateTag = useAppStore((state) => state.updateTag);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popover = usePopover();

  function open(dialog: TagDialog): void {
    popover.close();
    onOpenDialog(dialog);
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="icon-button"
        aria-label={t("tags.menu")}
        title={t("tags.menu")}
        aria-haspopup="dialog"
        aria-expanded={popover.open}
        onClick={popover.toggle}
      >
        <Icon name="more" size={18} />
      </button>
      <Popover anchorRef={anchorRef} open={popover.open} onClose={popover.close} align="end" label={t("tags.menu")}>
        <div className="menu-list">
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              open("rename");
            }}
          >
            <Icon name="pencil" size={16} />
            <span className="menu-item-label">{t("tags.rename")}</span>
          </button>
          <div className="menu-section" role="group" aria-label={t("tags.color")}>
            <span className="menu-section-title">{t("tags.color")}</span>
            <div className="color-swatches">
              {[null, ...TAG_COLORS].map((color) => {
                const label = color === null ? t("tags.noColor") : t(`tags.colors.${color}`);
                return (
                  <button
                    key={color ?? "none"}
                    type="button"
                    className="color-swatch"
                    aria-label={label}
                    title={label}
                    aria-pressed={tag.color === color}
                    onClick={() => {
                      void updateTag(tag.id, { color });
                    }}
                  >
                    <TagDot color={color} />
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              popover.close();
              void updateTag(tag.id, { archived: tag.archivedAt === null });
            }}
          >
            <Icon name="archive" size={16} />
            <span className="menu-item-label">{tag.archivedAt === null ? t("tags.archive") : t("tags.unarchive")}</span>
          </button>
          <button
            type="button"
            className="menu-item menu-item-danger"
            onClick={() => {
              open("delete");
            }}
          >
            <Icon name="trash" size={16} />
            <span className="menu-item-label">{t("tags.delete")}</span>
          </button>
        </div>
      </Popover>
    </>
  );
}

/** A tag page, or Inbox for reminders without tags when `tagId` is `null` (FR-TAG-3, FR-TAG-4). */
export function TagView({ tagId }: { tagId: string | null }) {
  const { t } = useTranslation();
  const format = useDateFormatter();
  const today = useAppStore((state) => state.today);
  const active = useAppStore((state) => state.active);
  const completed = useAppStore((state) => state.completed);
  const tag = useAppStore((state) => (tagId === null ? undefined : state.tags.find((item) => item.id === tagId)));
  const updateTag = useAppStore((state) => state.updateTag);
  const deleteTag = useAppStore((state) => state.deleteTag);
  const [dialog, setDialog] = useState<TagDialog>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const groups = useMemo(
    () => groupForTagPage(remindersOfTag([...active, ...completed], tagId), today),
    [active, completed, tagId, today]
  );

  if (tagId !== null && !tag) {
    return null;
  }

  const hideTagId = tag?.id;
  const activeCount = groups.overdue.length + groups.undated.length + groups.dated.flatMap((g) => g.reminders).length;

  return (
    <div className="view">
      <header className="view-header view-header-row">
        <div className="tag-heading">
          <h1>
            {tag ? <TagDot color={tag.color} /> : null}
            {tag ? tag.name : t("nav.inbox")}
          </h1>
          {tag?.archivedAt ? <p className="view-subtitle">{t("tags.archivedNote")}</p> : null}
        </div>
        {tag ? <TagMenu tag={tag} onOpenDialog={setDialog} /> : null}
      </header>

      {groups.overdue.length > 0 ? (
        <section className="group group-overdue" aria-labelledby="tag-group-overdue">
          <div className="group-header">
            <h2 id="tag-group-overdue">{t("today.overdue")}</h2>
            <span className="group-count">{groups.overdue.length}</span>
          </div>
          <ul className="rows">
            {groups.overdue.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} showDate hideTagId={hideTagId} />
            ))}
          </ul>
        </section>
      ) : null}

      {groups.dated.map((group) => (
        <section key={group.date} className="group" aria-labelledby={`tag-group-${group.date}`}>
          <div className="group-header">
            <h2 id={`tag-group-${group.date}`}>
              {format.dayLabel(group.date)}
              {hasRelativeLabel(today, group.date) ? (
                <span className="group-date">{format.shortDate(group.date)}</span>
              ) : null}
            </h2>
            <span className="group-count">{group.reminders.length}</span>
          </div>
          <ul className="rows">
            {group.reminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} hideTagId={hideTagId} />
            ))}
          </ul>
        </section>
      ))}

      {groups.undated.length > 0 ? (
        <section className="group" aria-labelledby="tag-group-undated">
          <div className="group-header">
            <h2 id="tag-group-undated">{t("dates.noDate")}</h2>
            <span className="group-count">{groups.undated.length}</span>
          </div>
          <ul className="rows">
            {groups.undated.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} hideTagId={hideTagId} />
            ))}
          </ul>
        </section>
      ) : null}

      {activeCount === 0 ? (
        <div className="empty-state">
          <Icon name={tag ? "tag" : "inbox"} size={22} />
          <p className="empty-title">{tag ? t("tags.emptyTitle") : t("tags.inboxEmptyTitle")}</p>
          <p className="empty-text">{tag ? t("tags.emptyText") : t("tags.inboxEmptyText")}</p>
        </div>
      ) : null}
      <div className="group-footer">
        <AddReminderRow />
      </div>

      {groups.completed.length > 0 ? (
        <section className="group" aria-labelledby="tag-group-completed">
          <div className="group-header">
            <h2 id="tag-group-completed">
              <button
                type="button"
                className="group-toggle"
                aria-expanded={showCompleted}
                onClick={() => {
                  setShowCompleted(!showCompleted);
                }}
              >
                <Icon name={showCompleted ? "chevronDown" : "chevronRight"} size={14} />
                {t("tags.completed")}
              </button>
            </h2>
            <span className="group-count">{groups.completed.length}</span>
          </div>
          {showCompleted ? (
            <ul className="rows">
              {groups.completed.map((reminder) => (
                <ReminderRow key={reminder.id} reminder={reminder} hideTagId={hideTagId} />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tag && dialog === "rename" ? (
        <TagNameDialog
          tag={tag}
          onClose={() => {
            setDialog(null);
          }}
          onSubmit={(name) => {
            setDialog(null);
            void updateTag(tag.id, { name });
          }}
        />
      ) : null}
      {tag && dialog === "delete" ? (
        <DeleteTagDialog
          tag={tag}
          reminderCount={remindersOfTag([...active, ...completed], tag.id).length}
          onClose={() => {
            setDialog(null);
          }}
          onConfirm={() => {
            setDialog(null);
            void deleteTag(tag.id);
          }}
        />
      ) : null}
    </div>
  );
}
