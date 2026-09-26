import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Reminder, ReminderPatch } from "../../../shared/types";
import {
  DESCRIPTION_MAX_LENGTH,
  TAG_MAX_LENGTH,
  TAGS_MAX_COUNT,
  tagNameKey,
  TITLE_MAX_LENGTH,
} from "../../../shared/validation";
import { findTagByName, useAppStore } from "../store";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";
import { DateButton, PriorityButton } from "./Pickers";
import { TagDot } from "./TagDot";

/** A tag chosen in the editor. A new name has no ID until the reminder is saved. */
interface TagDraft {
  id: string | null;
  name: string;
}

const SUGGESTION_LIMIT = 6;

type Suggestion = { kind: "tag"; id: string; name: string } | { kind: "create"; name: string };

/** Tags with suggestions from existing tags; any other name becomes a new tag (FR-TAG-9). */
function TagInput({ selected, onChange }: { selected: TagDraft[]; onChange: (tags: TagDraft[]) => void }) {
  const { t } = useTranslation();
  const tags = useAppStore((state) => state.tags);
  const [draft, setDraft] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputId = useId();
  const listId = useId();

  const query = draft.trim();
  const selectedKeys = new Set(selected.map((tag) => tagNameKey(tag.name)));
  const suggestions: Suggestion[] = [];
  if (query) {
    const key = tagNameKey(query);
    for (const tag of [...tags].sort((a, b) => a.name.localeCompare(b.name))) {
      const tagKey = tagNameKey(tag.name);
      if (tag.archivedAt === null && !selectedKeys.has(tagKey) && tagKey.includes(key)) {
        suggestions.push({ kind: "tag", id: tag.id, name: tag.name });
      }
    }
    suggestions.splice(SUGGESTION_LIMIT);
    if (!findTagByName(tags, query) && !selectedKeys.has(key)) {
      suggestions.push({ kind: "create", name: query });
    }
  }
  const activeIndex = Math.min(highlighted, suggestions.length - 1);
  const active = suggestions[activeIndex];

  function add(name: string): void {
    const trimmed = name.trim();
    setDraft("");
    setHighlighted(0);
    if (!trimmed || selectedKeys.has(tagNameKey(trimmed)) || selected.length >= TAGS_MAX_COUNT) {
      return;
    }
    const existing = findTagByName(tags, trimmed);
    onChange([...selected, existing ? { id: existing.id, name: existing.name } : { id: null, name: trimmed }]);
  }

  return (
    <div className="tag-input">
      <Icon name="tag" size={16} className="tag-input-icon" />
      {selected.map((tag) => (
        <span key={tagNameKey(tag.name)} className="tag-chip">
          <TagDot color={tags.find((item) => item.id === tag.id)?.color ?? null} />
          {tag.name}
          <button
            type="button"
            aria-label={t("reminder.removeTag", { tag: tag.name })}
            onClick={() => {
              onChange(selected.filter((item) => item !== tag));
            }}
          >
            <Icon name="close" size={12} />
          </button>
        </span>
      ))}
      {selected.length < TAGS_MAX_COUNT ? (
        <>
          <label htmlFor={inputId} className="visually-hidden">
            {t("reminder.tagsPlaceholder")}
          </label>
          <input
            id={inputId}
            value={draft}
            maxLength={TAG_MAX_LENGTH}
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active ? `${listId}-${String(activeIndex)}` : undefined}
            placeholder={selected.length === 0 ? t("reminder.tagsPlaceholder") : ""}
            onChange={(event) => {
              setDraft(event.target.value);
              setHighlighted(0);
            }}
            onBlur={() => {
              add(draft);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                add(event.key === "Enter" && active ? active.name : draft);
              } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length > 0) {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setHighlighted((activeIndex + step + suggestions.length) % suggestions.length);
              } else if (event.key === "Escape" && draft) {
                // Clear the draft instead of closing the dialog.
                event.preventDefault();
                setDraft("");
              } else if (event.key === "Backspace" && draft === "" && selected.length > 0) {
                onChange(selected.slice(0, -1));
              }
            }}
          />
          {suggestions.length > 0 ? (
            <ul id={listId} className="tag-suggestions" role="listbox" aria-label={t("tags.suggestions")}>
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.kind}-${suggestion.name}`}
                  id={`${listId}-${String(index)}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={["menu-item", index === activeIndex ? "is-highlighted" : ""].join(" ")}
                  onMouseDown={(event) => {
                    // Keep focus in the input, so blur does not add the typed text instead.
                    event.preventDefault();
                    add(suggestion.name);
                  }}
                  onMouseEnter={() => {
                    setHighlighted(index);
                  }}
                >
                  {suggestion.kind === "tag" ? (
                    <>
                      <TagDot color={tags.find((tag) => tag.id === suggestion.id)?.color ?? null} />
                      <span className="menu-item-label">{suggestion.name}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="plus" size={14} />
                      <span className="menu-item-label">{t("tags.createNamed", { name: suggestion.name })}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
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
  const allTags = useAppStore((state) => state.tags);
  const [tags, setTags] = useState<TagDraft[]>(() =>
    reminder.tagIds.flatMap((id) => {
      const tag = allTags.find((item) => item.id === id);
      return tag ? [{ id: tag.id, name: tag.name }] : [];
    })
  );
  const [confirming, setConfirming] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const isCompleted = reminder.status === "completed";

  const patch: ReminderPatch = {};
  if (title.trim() !== reminder.title) patch.title = title.trim();
  if (description !== reminder.description) patch.description = description;
  if (dueDate !== reminder.dueDate) patch.dueDate = dueDate;
  if (priority !== reminder.priority) patch.priority = priority;
  const tagIds = tags.flatMap((tag) => (tag.id === null ? [] : [tag.id]));
  const newTagNames = tags.flatMap((tag) => (tag.id === null ? [tag.name] : []));
  if (newTagNames.length > 0 || tagIds.join("\n") !== reminder.tagIds.join("\n")) patch.tagIds = tagIds;
  const canSave = title.trim().length > 0 && Object.keys(patch).length > 0;

  return (
    <form
      className="editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) {
          void updateReminder(reminder.id, patch, newTagNames).then(close);
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
      <TagInput selected={tags} onChange={setTags} />
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
