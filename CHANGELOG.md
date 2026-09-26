# Changelog

## [0.2.0] — Planned

Recurring reminders and full notification handling in the Windows desktop app.

### Backend

- [ ] Recurrence fields in the reminder model and API: once, daily, weekly, monthly, yearly (FR-REC-1).
- [ ] `advanceNoticeMinutes` and `snoozedUntil` fields in the model and API.
- [ ] Filtering by tag, priority, and status, and search by title and description (FR-REM-2, FR-REM-3).
- [ ] Integration tests for the new fields, filters, and search.

### Desktop app (Windows)

- [ ] Shared recurrence engine: next occurrence calculation in the reminder's time zone (FR-REC-2 to FR-REC-5).
- [ ] Edge cases: the 31st in shorter months, 29 February, skipped hour and repeated hour on daylight saving transitions (FR-REC-3, FR-REC-4, FR-REC-7, FR-REC-8).
- [ ] Unit tests for all recurrence edge cases, in time zones of both hemispheres.
- [ ] Completing an occurrence moves the reminder to the next occurrence. The user can stop the recurrence (FR-REC-6).
- [ ] Recurrence and advance notice controls in the reminder form (FR-NOT-1a).
- [ ] Advance notification before the due time (FR-NOT-1a).
- [ ] Snooze from the notification: 5, 15, 60 minutes, 1 day (FR-NOT-4).
- [ ] Mark as completed and open the reminder from the notification (FR-NOT-4).
- [ ] Missed reminders on start, showing only the latest missed occurrence of a recurring reminder (FR-NOT-5).
- [ ] Pop-up window notification channel (FR-NOT-2).
- [ ] Settings: turn each notification channel on or off. Defaults: OS notification on, sound on, pop-up window off (FR-NOT-2).
- [ ] Settings: default snooze duration.
- [ ] Reminder list: filters by tag, priority, and status, and search.
- [ ] English and Ukrainian translations for all new strings.

## [0.1.0] — Planned

Project foundation, backend with authentication and reminders, and a first working Windows desktop app. The app works online only in this version.

### Repository

- [ ] `.editorconfig` and shared Prettier settings.
- [ ] GitHub Actions: separate jobs for `backend/` and `frontend/` that run format check, lint, type check, tests, and build.

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
- [ ] Reminder model and CRUD API for one-time reminders: title, description, due date and time, time zone, priority, tags, status.
- [ ] Mark a reminder as completed (FR-REM-4).
- [ ] Integration tests for every endpoint.

### Desktop app (Windows)

- [ ] Project setup: Electron, React, TypeScript (`strict`), Vite, Zustand, ESLint, Prettier, Vitest.
- [ ] Localization with English and Ukrainian. Language from the OS, English as fallback, changeable in settings (section 7).
- [ ] Registration and sign-in screens, including the consent checkboxes.
- [ ] Secure token storage with Electron `safeStorage` (NFR-AUTH-3).
- [ ] Sign-out.
- [ ] Reminder list sorted by date and priority.
- [ ] Create, view, edit, and delete one-time reminders (FR-REM-1).
- [ ] Mark a reminder as completed.
- [ ] OS notification and sound at the due time (FR-NOT-1, FR-NOT-2).
- [ ] System tray with "Open", "New reminder", and "Quit". Closing the window hides it to the tray (FR-DESK-2).
- [ ] Only one running instance (FR-DESK-4).
- [ ] Launch at system startup, on by default, with a setting to turn it off (FR-DESK-3).
- [ ] Settings screen: language and launch at startup.

## Later versions

Each later version gets a detailed checklist when work on it starts.

- **0.3.0 — Offline mode and sync.** SQLite cache, unsynced status, sync on start and when the connection returns, soft deletes, conflict resolution, and synced account settings: first day of the week, time format, default snooze duration (sections 5 and 6).
- **0.4.0 — Privacy and monitoring.** Sentry in the backend and desktop app, server-side metrics, Google Analytics with consent, consent management in settings, Privacy Policy, and account deletion (sections 2.1, 2.2, 10.9 to 10.11).
- **0.5.0 — First public Windows release.** Stage and production deployment on DigitalOcean, NSIS installer with code signing, and automatic updates through GitHub Releases (section 10.5).
- **0.6.0 — macOS and Linux.** Signed and notarized DMG, AppImage and deb packages, platform-specific tray and startup behavior, and release builds for all three platforms in CI.
- **0.7.0 — Chrome extension: core.** Extension setup, sign-in, registration, viewing, creating, and editing reminders, IndexedDB cache, and sync.
- **0.8.0 — Chrome extension: notifications and release.** Browser notifications with `chrome.alarms`, snooze, missed reminders, Sentry and Google Analytics in the extension, and Chrome Web Store publication.
- **1.0.0 — Stable release.** Stabilization and bug fixes across all clients.
- **After 1.0.0.** Email verification and password reset (FR-AUTH-5, FR-AUTH-6), email and Telegram notifications (FR-NOT-6, FR-NOT-7).
