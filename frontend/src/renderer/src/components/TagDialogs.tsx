import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tag } from "../../../shared/types";
import { TAG_MAX_LENGTH } from "../../../shared/validation";
import { findTagByName, useAppStore } from "../store";
import { Dialog } from "./Dialog";

interface TagNameDialogProps {
  /** The tag to rename, or `undefined` to create a new one. */
  tag?: Tag;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

/** Name input for a new or renamed tag. Names are unique ignoring case (FR-TAG-6). */
export function TagNameDialog({ tag, onClose, onSubmit }: TagNameDialogProps) {
  const { t } = useTranslation();
  const tags = useAppStore((state) => state.tags);
  const [name, setName] = useState(tag?.name ?? "");
  const titleId = useId();
  const inputId = useId();
  const errorId = useId();
  const trimmed = name.trim();
  const other = trimmed ? findTagByName(tags, trimmed) : undefined;
  const taken = other !== undefined && other.id !== tag?.id;
  const unchanged = tag !== undefined && trimmed === tag.name;
  const canSubmit = trimmed.length > 0 && !taken && !unchanged;

  return (
    <Dialog open onClose={onClose} className="dialog-small" labelledBy={titleId}>
      <form
        className="confirm"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) {
            onSubmit(trimmed);
          }
        }}
      >
        <h2 id={titleId}>{tag ? t("tags.renameTitle") : t("tags.newTitle")}</h2>
        <label htmlFor={inputId} className="visually-hidden">
          {t("tags.namePlaceholder")}
        </label>
        <input
          id={inputId}
          className="text-input"
          placeholder={t("tags.namePlaceholder")}
          maxLength={TAG_MAX_LENGTH}
          autoComplete="off"
          autoFocus
          value={name}
          aria-invalid={taken}
          aria-describedby={taken ? errorId : undefined}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        {taken ? (
          <p id={errorId} className="field-error">
            {t("tags.nameTaken")}
          </p>
        ) : null}
        <div className="form-toolbar">
          <span className="toolbar-spacer" />
          <button type="button" className="button" onClick={onClose}>
            {t("reminder.cancel")}
          </button>
          <button type="submit" className="button button-primary" disabled={!canSubmit}>
            {tag ? t("tags.rename") : t("tags.create")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Creates a tag from the sidebar and opens its page (FR-TAG-2). */
export function NewTagDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (tag: Tag) => void }) {
  const createTag = useAppStore((state) => state.createTag);
  return (
    <TagNameDialog
      onClose={onClose}
      onSubmit={(name) => {
        void createTag(name).then((tag) => {
          if (tag) {
            onCreated(tag);
          }
        });
      }}
    />
  );
}

interface DeleteTagDialogProps {
  tag: Tag;
  reminderCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

/** States how many reminders lose the tag. The reminders are kept (FR-TAG-8). */
export function DeleteTagDialog({ tag, reminderCount, onClose, onConfirm }: DeleteTagDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <Dialog open onClose={onClose} className="dialog-small" labelledBy={titleId}>
      <div className="confirm">
        <h2 id={titleId}>{t("tags.deleteTitle")}</h2>
        <p>
          {reminderCount > 0
            ? t("tags.deleteText", { name: tag.name, count: reminderCount })
            : t("tags.deleteTextEmpty", { name: tag.name })}
        </p>
        <div className="form-toolbar">
          <span className="toolbar-spacer" />
          <button type="button" className="button" onClick={onClose} autoFocus>
            {t("reminder.cancel")}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm}>
            {t("reminder.delete")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
