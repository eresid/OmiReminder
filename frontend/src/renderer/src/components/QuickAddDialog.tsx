import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Priority } from "../../../shared/types";
import { TITLE_MAX_LENGTH } from "../../../shared/validation";
import { useAppStore } from "../store";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { DateButton, PriorityButton } from "./Pickers";
import { TagDot } from "./TagDot";

function QuickAddForm() {
  const { t } = useTranslation();
  const defaults = useAppStore((state) => state.quickAddDefaults);
  const allTags = useAppStore((state) => state.tags);
  const createReminder = useAppStore((state) => state.createReminder);
  const close = useAppStore((state) => state.closeQuickAdd);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaults.dueDate);
  const [priority, setPriority] = useState<Priority>("normal");
  const [tagIds, setTagIds] = useState(defaults.tagIds);
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const canSubmit = title.trim().length > 0 && !saving;
  const tags = tagIds.flatMap((id) => allTags.filter((tag) => tag.id === id));

  return (
    <form
      className="quick-add"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }
        setSaving(true);
        void createReminder({ title: title.trim(), dueDate, priority, tagIds }).then(close);
      }}
    >
      <label htmlFor={titleId} className="visually-hidden">
        {t("reminder.titlePlaceholder")}
      </label>
      <input
        id={titleId}
        className="title-input"
        placeholder={t("reminder.titlePlaceholder")}
        maxLength={TITLE_MAX_LENGTH}
        autoComplete="off"
        autoFocus
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
        }}
      />
      <div className="form-toolbar">
        <DateButton value={dueDate} onChange={setDueDate} />
        <PriorityButton value={priority} onChange={setPriority} />
        {/* The tag of the page quick-add was opened on (FR-TAG-5). */}
        {tags.map((tag) => (
          <span key={tag.id} className="tag-chip tag-chip-large">
            <TagDot color={tag.color} />
            {tag.name}
            <button
              type="button"
              aria-label={t("reminder.removeTag", { tag: tag.name })}
              onClick={() => {
                setTagIds(tagIds.filter((id) => id !== tag.id));
              }}
            >
              <Icon name="close" size={12} />
            </button>
          </span>
        ))}
        <span className="toolbar-spacer" />
        <button type="button" className="button" onClick={close}>
          {t("reminder.cancel")}
        </button>
        <button type="submit" className="button button-primary" disabled={!canSubmit}>
          {t("reminder.add")}
        </button>
      </div>
    </form>
  );
}

/** Compact creation: title, date, and priority only (FR-REM-5). */
export function QuickAddDialog() {
  const open = useAppStore((state) => state.quickAddOpen);
  const close = useAppStore((state) => state.closeQuickAdd);
  return (
    <Dialog open={open} onClose={close} className="dialog-top">
      <QuickAddForm />
    </Dialog>
  );
}
