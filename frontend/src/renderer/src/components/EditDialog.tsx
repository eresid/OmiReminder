import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Reminder, ReminderPatch } from "../../../shared/types";
import {
  DESCRIPTION_MAX_LENGTH,
  normalizeTags,
  TAG_MAX_LENGTH,
  TAGS_MAX_COUNT,
  TITLE_MAX_LENGTH,
} from "../../../shared/validation";
import { useAppStore } from "../store";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { DateButton, PriorityButton } from "./Pickers";

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const inputId = useId();

  function commit(): void {
    if (draft.trim()) {
      onChange(normalizeTags([...tags, draft]));
      setDraft("");
    }
  }

  return (
    <div className="tag-input">
      <Icon name="tag" size={16} className="tag-input-icon" />
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
          <button
            type="button"
            aria-label={t("reminder.removeTag", { tag })}
            onClick={() => {
              onChange(tags.filter((item) => item !== tag));
            }}
          >
            <Icon name="close" size={12} />
          </button>
        </span>
      ))}
      {tags.length < TAGS_MAX_COUNT ? (
        <>
          <label htmlFor={inputId} className="visually-hidden">
            {t("reminder.tagsPlaceholder")}
          </label>
          <input
            id={inputId}
            value={draft}
            maxLength={TAG_MAX_LENGTH}
            placeholder={tags.length === 0 ? t("reminder.tagsPlaceholder") : ""}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commit();
              } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
                onChange(tags.slice(0, -1));
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function ConfirmDelete({
  reminder,
  onCancel,
  onConfirm,
}: {
  reminder: Reminder;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <Dialog open onClose={onCancel} className="dialog-small" labelledBy={titleId}>
      <div className="confirm">
        <h2 id={titleId}>{t("reminder.deleteTitle")}</h2>
        <p>{t("reminder.deleteText", { title: reminder.title })}</p>
        <div className="form-toolbar">
          <span className="toolbar-spacer" />
          <button type="button" className="button" onClick={onCancel} autoFocus>
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

function EditForm({ reminder }: { reminder: Reminder }) {
  const { t } = useTranslation();
  const close = useAppStore((state) => state.closeEditor);
  const updateReminder = useAppStore((state) => state.updateReminder);
  const deleteReminder = useAppStore((state) => state.deleteReminder);
  const [title, setTitle] = useState(reminder.title);
  const [description, setDescription] = useState(reminder.description);
  const [dueDate, setDueDate] = useState(reminder.dueDate);
  const [priority, setPriority] = useState(reminder.priority);
  const [tags, setTags] = useState(reminder.tags);
  const [confirming, setConfirming] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const isCompleted = reminder.status === "completed";

  const patch: ReminderPatch = {};
  if (title.trim() !== reminder.title) patch.title = title.trim();
  if (description !== reminder.description) patch.description = description;
  if (dueDate !== reminder.dueDate) patch.dueDate = dueDate;
  if (priority !== reminder.priority) patch.priority = priority;
  if (tags.join("\n") !== reminder.tags.join("\n")) patch.tags = tags;
  const canSave = title.trim().length > 0 && Object.keys(patch).length > 0;

  return (
    <form
      className="editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) {
          void updateReminder(reminder.id, patch).then(close);
        }
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
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
        }}
      />
      <label htmlFor={descriptionId} className="visually-hidden">
        {t("reminder.descriptionPlaceholder")}
      </label>
      <textarea
        id={descriptionId}
        className="description-input"
        placeholder={t("reminder.descriptionPlaceholder")}
        maxLength={DESCRIPTION_MAX_LENGTH}
        rows={4}
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
        }}
      />
      <TagInput tags={tags} onChange={setTags} />
      <div className="form-toolbar">
        {isCompleted ? null : <DateButton value={dueDate} onChange={setDueDate} />}
        <PriorityButton value={priority} onChange={setPriority} />
        <span className="toolbar-spacer" />
        <button
          type="button"
          className="icon-button icon-button-danger"
          aria-label={t("reminder.delete")}
          title={t("reminder.delete")}
          onClick={() => {
            setConfirming(true);
          }}
        >
          <Icon name="trash" size={18} />
        </button>
        <button type="button" className="button" onClick={close}>
          {t("reminder.cancel")}
        </button>
        <button type="submit" className="button button-primary" disabled={!canSave}>
          {t("reminder.save")}
        </button>
      </div>
      {confirming ? (
        <ConfirmDelete
          reminder={reminder}
          onCancel={() => {
            setConfirming(false);
          }}
          onConfirm={() => {
            close();
            void deleteReminder(reminder.id);
          }}
        />
      ) : null}
    </form>
  );
}

/** Full editing, including description and tags (FR-REM-5b). */
export function EditDialog() {
  const editingId = useAppStore((state) => state.editingId);
  const close = useAppStore((state) => state.closeEditor);
  const reminder = useAppStore((state) =>
    editingId === null
      ? undefined
      : (state.active.find((item) => item.id === editingId) ?? state.completed.find((item) => item.id === editingId))
  );
  return (
    <Dialog open={reminder !== undefined} onClose={close} className="dialog-top dialog-wide">
      {reminder ? <EditForm key={reminder.id} reminder={reminder} /> : null}
    </Dialog>
  );
}
