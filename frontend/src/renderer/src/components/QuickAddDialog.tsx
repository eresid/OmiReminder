import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Priority } from "../../../shared/types";
import { TITLE_MAX_LENGTH } from "../../../shared/validation";
import { useAppStore } from "../store";
import { Dialog } from "./Dialog";
import { DateButton, PriorityButton } from "./Pickers";

function QuickAddForm() {
  const { t } = useTranslation();
  const today = useAppStore((state) => state.today);
  const createReminder = useAppStore((state) => state.createReminder);
  const close = useAppStore((state) => state.closeQuickAdd);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [priority, setPriority] = useState<Priority>("normal");
  const [saving, setSaving] = useState(false);
  const titleId = useId();
  const canSubmit = title.trim().length > 0 && !saving;

  return (
    <form
      className="quick-add"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }
        setSaving(true);
        void createReminder({ title: title.trim(), dueDate, priority }).then(close);
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
