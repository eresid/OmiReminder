# Changelog

## [0.4.0] — Planned

Recurring reminders and full notification handling in the Windows desktop app.

### Backend

- [ ] Recurrence fields in the reminder model and API: once, daily, weekly, monthly, yearly (FR-REC-1). A recurring reminder must have a date (FR-NODATE-3).
- [ ] Date-only occurrence deferrals in the reminder model and API for rescheduling recurring reminders (FR-REM-6a).
- [ ] Filtering by tag, priority, and status, and search by title and description (FR-REM-2, FR-REM-3).
- [ ] Integration tests for the new fields, filters, and search.

### Desktop app (Windows)

- [ ] Shared recurrence engine: next occurrence date calculation from the date-only reminder value (FR-REC-2 to FR-REC-5).
- [ ] Edge cases: the 31st in shorter months and 29 February (FR-REC-3, FR-REC-4).
- [ ] Unit tests for recurrence dates and local notification scheduling across skipped and repeated hours in time zones of both hemispheres (FR-NOT-1c).
- [ ] Completing an occurrence moves the reminder to the next occurrence after today. The user can stop the recurrence (FR-REC-6).
- [ ] A missed recurring reminder is shown once and stays overdue only until its next occurrence date, so daily reminders are never overdue (FR-REC-7).
- [ ] Add Repeat controls to the date-picker popup in the compact creation flow and to full editing. "No date" is unavailable while Repeat is set (FR-REM-5a, FR-REM-5b, FR-NODATE-3).
- [ ] Rescheduling a recurring reminder defers only the current occurrence, preserving the recurrence schedule (FR-REM-6a).
- [ ] Pop-up window channel for the daily summary (FR-NOT-2).
- [ ] Settings: turn each notification channel on or off. Defaults: OS notification on, sound on, pop-up window off (FR-NOT-2).
- [ ] "All reminders" screen: filters by priority and status, and search (FR-REM-2, FR-REM-3).
- [ ] Global quick-add shortcut: opens the compact quick-add form in a small window from anywhere in the system. Configurable in settings, can be turned off, and reports when the shortcut is taken by another app (FR-DESK-7).
- [ ] English and Ukrainian translations for all new strings.

## [0.3.0] — Planned

Backend with authentication, reminders, and tags, and sync between the desktop app's local database and the server.

### Repository

- [ ] GitHub Actions: a separate job for `backend/` that runs format check, lint, type check, tests, and build.

### Backend

- [ ] Project setup: TypeScript (`strict`), Express, Mongoose, dotenv, cross-env, ESLint, Prettier, Vitest, Supertest, `mongodb-memory-server`.
- [ ] Configuration from environment variables, `APP_ENV` (`local`, `stage`, `production`), and `.env.example`.
- [ ] Central error handling and input validation.
- [ ] Health check endpoint.
- [ ] OpenAPI document and Swagger UI at `/api/docs`, disabled in production.
- [ ] User model with `emailVerified` and consent records (FR-CONS-3).
- [ ] Registration with the two consent checkboxes: required Privacy Policy acceptance, optional usage statistics (section 2.1).
- [ ] Sign-in, token refresh, and sign-out with access and refresh tokens (NFR-AUTH-2).
- [ ] Password hashing (NFR-AUTH-1) and rate limiting for authentication endpoints (NFR-AUTH-4).
- [ ] Reminder model and CRUD API for one-time reminders: title, description, optional date-only `dueDate`, priority, `tagIds`, status, `version`, soft delete with `deletedAt` (FR-SYNC-5). No reminder time is stored on the server.
- [ ] Tag model and CRUD API: name unique per account ignoring case, color, `archivedAt`, `version`, soft delete with `deletedAt` (section 3.6).
- [ ] Mark a reminder as completed (FR-REM-4).
- [ ] Sync endpoints for reminders and tags: accept client changes and return changes since the last sync, with last write wins by server-accepted `updatedAt` (FR-SYNC-6). Tags with the same name created on different clients are merged (FR-SYNC-8).
- [ ] Account settings: first day of the week and time format (section 6).
- [ ] Integration tests for every endpoint, including tag merging on sync.

### Desktop app (Windows)

- [ ] Registration and sign-in screens, including the consent checkboxes.
- [ ] Secure token storage with Electron `safeStorage` (NFR-AUTH-3).
- [ ] Sign-out, with a warning about unsynced changes and clearing the local data for that account (FR-AUTH-4).
- [ ] On the first sign-in, upload reminders and tags created locally before sign-in to the account.
- [ ] Unsynced status for local changes, shown in the UI (FR-SYNC-2).
- [ ] Sync of reminders and tags on start, after sign-in, periodically while online, and when the connection returns (FR-SYNC-3, FR-SYNC-4).
- [ ] Unit tests for the sync logic, including conflicts, soft deletes, and merged tags.
- [ ] Settings: first day of the week and time format, synced with the account (section 6).
- [ ] English and Ukrainian translations for all new strings.

## [0.2.0] — Planned

Tags as projects, reminders without a date, and tag filters in the Windows desktop app. Still local only: no backend, no account, and no sync in this version.

### Desktop app (Windows)

- [ ] Tags as separate records in the local database: client-generated UUID `id`, name unique ignoring case, optional color, `archivedAt`, UTC `createdAt` and `updatedAt`, and soft delete with `deletedAt` (section 3.6). Reminders reference tags by `tagIds` instead of tag names. The initial schema is changed in place, without a migration, because there is no local data to keep: a local database from 0.1.0 must be deleted before starting 0.2.0.
- [ ] Optional `dueDate` in the local database, validation, and IPC (section 3.1, FR-NODATE-1).
- [ ] Sidebar "Tags" section: Inbox, non-archived tags with active reminder counts, creating a tag, and a collapsed "Archived" entry (FR-TAG-2, FR-TAG-4, FR-TAG-7).
- [ ] Tag page and Inbox: overdue, by date, no date, and collapsed completed groups, with quick actions (FR-TAG-3, FR-TAG-4).
- [ ] Tag menu: rename, change color, archive and unarchive, and delete with confirmation (FR-TAG-6 to FR-TAG-8).
- [ ] Tags input on the full editing screen with suggestions from existing tags (FR-TAG-9).
- [ ] Quick-add on a tag page or in Inbox defaults to "No date" and presets the tag as a removable chip (FR-TAG-5).
- [ ] Reminders without a date: "No date" in the date-picker popup of quick-add and full editing, "Set date" quick action, and exclusion from the main screen, "All reminders", group counts, the tray badge, and the daily summary (FR-NODATE-1 to FR-NODATE-5).
- [ ] Tag filter on the main screen and the "All reminders" screen: several tags and "No tag", hidden count with overdue, clear action, kept per screen until the app quits (FR-TAG-10 to FR-TAG-12, FR-MAIN-9).
- [ ] "Reschedule all" for the overdue group: today, tomorrow, or a chosen date, with Undo. With a tag filter, only the visible reminders (FR-MAIN-8, FR-TAG-12).
- [ ] Recalculate the main screen groups and the next summary time at local midnight, on resume, and after the device time zone changes (FR-MAIN-6, FR-NOT-1b). Midnight and resume are done; a real Windows time zone change is not verified yet.
- [ ] Unit tests for tag validation and name uniqueness, tag deletion and archiving, tag page grouping, tag filters and hidden counts, and exclusion of reminders without a date from counts and the daily summary.
- [ ] English and Ukrainian translations for all new strings.

## [0.1.0] — 26.09.2026

A local Windows desktop app: one-time date-based reminders, a main screen with overdue, today, and next day groups, and one daily summary notification, stored in a local SQLite database. No backend, no account, and no sync in this version.

### Repository

- [x] `.editorconfig` and shared Prettier settings.
- [x] GitHub Actions: a job for `frontend/` that runs format check, lint, type check, tests, and build.

### Desktop app (Windows)

- [x] Project setup: Electron, electron-vite, React, TypeScript (`strict`), Vite, Zustand, i18next, ESLint, Prettier, Vitest.
- [x] Localization with English and Ukrainian. Language from the OS, English as fallback, changeable in settings (section 7).
- [x] Local SQLite database in the Electron main process, with schema migrations (section 5).
- [x] Reminder storage with the fields from section 3.1 that do not depend on the server: client-generated UUID `id`, title, description, date-only `dueDate`, priority, tags, status, UTC `createdAt` and `updatedAt`.
- [x] Main screen: overdue (red, at the top), today, and the next day that has reminders, sorted by priority within each group (FR-MAIN-1 to FR-MAIN-6).
- [x] "All reminders" screen sorted by date and priority (FR-REM-2).
- [x] Compact quick-add for one-time reminders: Title, Today date button, Normal priority button, and create action. The date button opens a calendar popup (FR-REM-5, FR-REM-5a).
- [x] Full reminder editing after creation, including description and tags (FR-REM-5b); view and delete one-time reminders (FR-REM-1).
- [x] Mark a reminder as completed from the main screen, with Undo. Completed reminders of today and the next day stay struck through at the bottom of their group (FR-REM-4, FR-MAIN-7).
- [x] Reschedule a reminder: "Tomorrow" or a date picker (FR-REM-6).
- [x] One daily summary notification with OS notification and sound at the locally configured daily notification time, only when there are overdue or today reminders. Clicking it opens the main screen (FR-NOT-1, FR-NOT-2, FR-NOT-4).
- [x] Show the daily summary on a late start if it was missed that day, and never more than once per day (FR-NOT-1a, FR-NOT-5).
- [x] System tray with "Open", "New reminder", and "Quit". Closing the window hides it to the tray (FR-DESK-2).
- [x] Tray icon badge with the number of overdue and today reminders, red when anything is overdue, and a tooltip with both counts (FR-DESK-6).
- [x] Only one running instance (FR-DESK-4).
- [x] Launch at system startup, on by default, with a setting to turn it off (FR-DESK-3).
- [x] Settings screen: language, launch at startup, and a locally stored daily notification time (FR-SET-1a).
- [x] Theme setting: system (default), light, or dark (FR-SET-4).
- [x] Unsigned portable Windows build with `pnpm package` (electron-builder): a portable `.exe` and an unpacked folder. Build and run instructions in README.md.
- [x] Unit tests for the local database layer, main screen grouping and sorting, and daily summary scheduling.

## Later versions

Each later version gets a detailed checklist when work on it starts.

- **0.5.0 — Privacy and monitoring.** Sentry in the backend and desktop app, server-side metrics, Google Analytics with consent, consent management in settings, Privacy Policy, and account deletion (sections 2.1, 2.2, 10.9 to 10.11).
- **0.6.0 — First public Windows release.** Stage and production deployment on DigitalOcean, NSIS installer with code signing, and automatic updates through GitHub Releases (section 10.5). The installer switches the notification app ID from the executable path to the `appId` (see `frontend/src/main/index.ts`). "Repeat after completion": every N days, weeks, or months from the completion date, in the model, API, sync, and desktop app (FR-REC-8).
- **0.7.0 — macOS and Linux.** Signed and notarized DMG, AppImage and deb packages, platform-specific tray and startup behavior, and release builds for all three platforms in CI.
- **0.8.0 — Chrome extension: core.** Extension setup, sign-in, registration, compact quick-add and full editing of date-only reminders, the main screen in the popup, tag pages, Inbox, tag filters, and reminders without a date (FR-EXT-2), a locally stored daily notification time, the theme setting, IndexedDB cache, and sync.
- **0.9.0 — Chrome extension: notifications and release.** Daily summary as a browser notification with `chrome.alarms`, including on a late start, toolbar icon badge (FR-EXT-4), "Remind me about this page" (FR-EXT-5), Sentry and Google Analytics in the extension, and Chrome Web Store publication.
- **1.0.0 — Stable release.** Mobile apps for iOS and Android. AI integration, starting with natural-language dates and recurrence in quick-add, in English and Ukrainian (FR-REM-7). Streaks (FR-STAT-1). Stabilization and bug fixes across all clients.
- **After 1.0.0.** Email verification and password reset (FR-AUTH-5, FR-AUTH-6), email and Telegram notifications (FR-NOT-6, FR-NOT-7).
