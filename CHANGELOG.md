# Changelog

## [0.3.0] — Planned

Recurring reminders and full notification handling in the Windows desktop app.

### Backend

- [ ] Recurrence fields in the reminder model and API: once, daily, weekly, monthly, yearly (FR-REC-1).
- [ ] Date-only occurrence deferrals in the reminder model and API for Snooze of recurring reminders (FR-NOT-4a).
- [ ] Filtering by tag, priority, and status, and search by title and description (FR-REM-2, FR-REM-3).
- [ ] Integration tests for the new fields, filters, and search.

### Desktop app (Windows)

- [ ] Shared recurrence engine: next occurrence date calculation from the date-only reminder value (FR-REC-2 to FR-REC-5).
- [ ] Edge cases: the 31st in shorter months and 29 February (FR-REC-3, FR-REC-4).
- [ ] Unit tests for recurrence dates and local notification scheduling across skipped and repeated hours in time zones of both hemispheres (FR-NOT-1c).
- [ ] Completing an occurrence moves the reminder to the next occurrence. The user can stop the recurrence (FR-REC-6).
- [ ] Recurrence controls in the date-only reminder form.
- [ ] Snooze from the notification opens a date picker and saves the selected future date (FR-NOT-4).
- [ ] Snoozing a recurring reminder defers only the selected occurrence, preserving the recurrence schedule (FR-NOT-4a).
- [ ] Mark as completed and open the reminder from the notification (FR-NOT-4).
- [ ] Missed reminders on start, showing only the latest missed occurrence of a recurring reminder (FR-NOT-5).
- [ ] Pop-up window notification channel (FR-NOT-2).
- [ ] Settings: turn each notification channel on or off. Defaults: OS notification on, sound on, pop-up window off (FR-NOT-2).
- [ ] Reminder list: filters by tag, priority, and status, and search.
- [ ] English and Ukrainian translations for all new strings.

## [0.2.0] — Planned

Backend with authentication and reminders, and sync between the desktop app's local database and the server.

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
- [ ] Reminder model and CRUD API for one-time reminders: title, description, date-only `dueDate`, priority, tags, status, `version`, soft delete with `deletedAt` (FR-SYNC-5). No reminder time is stored on the server.
- [ ] Mark a reminder as completed (FR-REM-4).
- [ ] Sync endpoints: accept client changes and return changes since the last sync, with last write wins by server-accepted `updatedAt` (FR-SYNC-6).
- [ ] Account settings: first day of the week and time format (section 6).
- [ ] Integration tests for every endpoint.

### Desktop app (Windows)

- [ ] Registration and sign-in screens, including the consent checkboxes.
- [ ] Secure token storage with Electron `safeStorage` (NFR-AUTH-3).
- [ ] Sign-out, with a warning about unsynced changes and clearing the local data for that account (FR-AUTH-4).
- [ ] On the first sign-in, upload reminders created locally before sign-in to the account.
- [ ] Unsynced status for local changes, shown in the UI (FR-SYNC-2).
- [ ] Sync on start, after sign-in, periodically while online, and when the connection returns (FR-SYNC-3, FR-SYNC-4).
- [ ] Unit tests for the sync logic, including conflicts and soft deletes.
- [ ] Settings: first day of the week and time format, synced with the account (section 6).
- [ ] English and Ukrainian translations for all new strings.

## [0.1.0] — Planned

A local Windows desktop app: one-time reminders with notifications, stored in a local SQLite database. No backend, no account, and no sync in this version.

### Repository

- [ ] `.editorconfig` and shared Prettier settings.
- [ ] GitHub Actions: a job for `frontend/` that runs format check, lint, type check, tests, and build.

### Desktop app (Windows)

- [ ] Project setup: Electron, React, TypeScript (`strict`), Vite, Zustand, ESLint, Prettier, Vitest.
- [ ] Localization with English and Ukrainian. Language from the OS, English as fallback, changeable in settings (section 7).
- [ ] Local SQLite database in the Electron main process, with schema migrations (section 5).
- [ ] Reminder storage with the fields from section 3.1 that do not depend on the server: client-generated UUID `id`, title, description, date-only `dueDate`, priority, tags, status, UTC `createdAt` and `updatedAt`.
- [ ] Reminder list sorted by date and priority.
- [ ] Create, view, edit, and delete one-time reminders (FR-REM-1).
- [ ] Mark a reminder as completed.
- [ ] OS notification and sound on the due date at the device's locally configured daily notification time (FR-NOT-1, FR-NOT-2).
- [ ] System tray with "Open", "New reminder", and "Quit". Closing the window hides it to the tray (FR-DESK-2).
- [ ] Only one running instance (FR-DESK-4).
- [ ] Launch at system startup, on by default, with a setting to turn it off (FR-DESK-3).
- [ ] Settings screen: language, launch at startup, and a locally stored daily notification time (FR-SET-1a).
- [ ] Unit tests for the local database layer and notification scheduling.
- [ ] Recalculate notification times after the device time zone changes or the app resumes (FR-NOT-1b).

## Later versions

Each later version gets a detailed checklist when work on it starts.

- **0.4.0 — Privacy and monitoring.** Sentry in the backend and desktop app, server-side metrics, Google Analytics with consent, consent management in settings, Privacy Policy, and account deletion (sections 2.1, 2.2, 10.9 to 10.11).
- **0.5.0 — First public Windows release.** Stage and production deployment on DigitalOcean, NSIS installer with code signing, and automatic updates through GitHub Releases (section 10.5).
- **0.6.0 — macOS and Linux.** Signed and notarized DMG, AppImage and deb packages, platform-specific tray and startup behavior, and release builds for all three platforms in CI.
- **0.7.0 — Chrome extension: core.** Extension setup, sign-in, registration, viewing, creating, and editing date-only reminders, a locally stored daily notification time, IndexedDB cache, and sync.
- **0.8.0 — Chrome extension: notifications and release.** Browser notifications with `chrome.alarms`, date-picker Snooze, missed reminders, Sentry and Google Analytics in the extension, and Chrome Web Store publication.
- **1.0.0 — Stable release.** Stabilization and bug fixes across all clients.
- **After 1.0.0.** Email verification and password reset (FR-AUTH-5, FR-AUTH-6), email and Telegram notifications (FR-NOT-6, FR-NOT-7).
