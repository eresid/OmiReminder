import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidTime } from "../../../shared/summary";
import type { Language } from "../../../shared/types";
import { useAppStore } from "../store";

const LANGUAGES: readonly Language[] = ["en", "uk"];

function SettingRow({
  label,
  hint,
  controlId,
  children,
}: {
  label: string;
  hint: string;
  controlId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <label htmlFor={controlId} className="setting-label">
          {label}
        </label>
        <p className="setting-hint" id={`${controlId}-hint`}>
          {hint}
        </p>
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { t } = useTranslation();
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  // A draft is kept while the time is being edited and committed on blur.
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const time = draftTime ?? settings.notificationTime;
  const languageId = useId();
  const startupId = useId();
  const timeId = useId();

  return (
    <div className="view">
      <header className="view-header">
        <h1>{t("settings.title")}</h1>
      </header>
      <div className="settings">
        <SettingRow label={t("settings.language")} hint={t("settings.languageHint")} controlId={languageId}>
          <select
            id={languageId}
            className="select"
            aria-describedby={`${languageId}-hint`}
            value={settings.language}
            onChange={(event) => {
              void updateSettings({ language: event.target.value as Language });
            }}
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {t(`languages.${language}`)}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow
          label={t("settings.launchAtStartup")}
          hint={t("settings.launchAtStartupHint")}
          controlId={startupId}
        >
          <button
            id={startupId}
            type="button"
            role="switch"
            className="switch"
            aria-checked={settings.launchAtStartup}
            aria-describedby={`${startupId}-hint`}
            onClick={() => {
              void updateSettings({ launchAtStartup: !settings.launchAtStartup });
            }}
          >
            <span className="switch-thumb" />
          </button>
        </SettingRow>

        <SettingRow label={t("settings.notificationTime")} hint={t("settings.notificationTimeHint")} controlId={timeId}>
          <input
            id={timeId}
            type="time"
            className="time-input"
            aria-describedby={`${timeId}-hint`}
            value={time}
            required
            onChange={(event) => {
              setDraftTime(event.target.value);
            }}
            onBlur={() => {
              if (isValidTime(time) && time !== settings.notificationTime) {
                void updateSettings({ notificationTime: time });
              }
              setDraftTime(null);
            }}
          />
        </SettingRow>
      </div>
    </div>
  );
}
