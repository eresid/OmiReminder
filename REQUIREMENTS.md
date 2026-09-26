# OmiReminder — Requirements

This document describes the functional and technical requirements for OmiReminder. It is the reference for scope and design decisions. When a requirement changes, update this file in the same change.

Status: draft, initial planning stage.

## 1. Overview

OmiReminder is a cross-platform reminder app. It has two clients and one remote backend:

| Component | Directory | Description |
|---|---|---|
| Desktop app | `frontend/` | Electron app for Windows, macOS, and Linux. Runs in the system tray. |
| Browser extension | `extension/` | Chrome extension (Manifest V3). |
| Backend API | `backend/` | Express.js REST API deployed on a remote server, with MongoDB storage. |

Both clients work offline with a local cache and sync with the backend when a connection is available.

## 2. Users and authentication

- **FR-AUTH-1.** A user registers and signs in with email and password.
- **FR-AUTH-2.** One client instance is signed in to one account at a time. Multiple simultaneous accounts are out of scope.
- **FR-AUTH-3.** The same account can be used on several devices and in the extension at the same time. All of them see the same reminders after sync.
- **FR-AUTH-4.** The user can sign out. Signing out clears the local cache for that account after warning about unsynced changes.
- **NFR-AUTH-1.** Passwords are stored only as strong hashes (argon2 or bcrypt).
- **NFR-AUTH-2.** The API uses short-lived access tokens and long-lived refresh tokens (JWT). Refresh tokens can be revoked.
- **NFR-AUTH-3.** Tokens are stored securely on the client: Electron `safeStorage` on desktop, `chrome.storage.local` in the extension. Tokens are never stored in plain files or exposed to web page contexts.
- **NFR-AUTH-4.** The sign-in and registration endpoints are rate-limited.
- **FR-AUTH-5 (version 2).** Email verification after registration.
- **FR-AUTH-6 (version 2).** Password reset by email.

The first version has no email sending. The user model should still include an `emailVerified` field so version 2 does not need a data migration.

### 2.1 Consent

The registration form has two separate checkboxes. Both are unchecked by default:

| Checkbox | Required | Effect |
|---|---|---|
| "I agree to the Privacy Policy" (with a link to the policy) | yes | Registration is not possible without it. |
| "Allow usage statistics to help improve the app" | no | Enables Google Analytics (see 10.10). Registration does not depend on it. |

- **FR-CONS-1.** Accepting the Privacy Policy is required for registration. It covers the processing needed for the service, crash reports (see 10.9), and server-side metrics (see 10.10). These do not need separate consent.
- **FR-CONS-2.** Consent to usage statistics is optional and separate. Without it, Google Analytics is not used for this account.
- **FR-CONS-3.** Both records are stored on the server with the account: the date and time, the Privacy Policy version, and for usage statistics whether it was given or withdrawn.
- **FR-CONS-4.** The user can give or withdraw consent to usage statistics at any time in settings. The change syncs to all clients of the account.
- **FR-CONS-5.** When a new Privacy Policy version is published, the user must accept it on the next sign-in or app start to continue using the app. Consent to usage statistics is kept.

### 2.2 Account deletion

- **FR-DEL-1.** The user can delete their account from settings in the desktop app and in the extension. Deletion requires an internet connection and confirmation with the account password.
- **FR-DEL-2.** Deleting the account permanently removes the user and all their reminders, settings, and consent records from the server, and revokes all tokens.
- **FR-DEL-3.** The client that deleted the account clears its local cache. Other clients clear their local cache on the next sync, when the server reports that the account no longer exists.
- **FR-DEL-4.** The Privacy Policy contains step-by-step instructions for deleting the account.

## 3. Reminders

### 3.1 Fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes | UUID generated on the client, so records can be created offline. |
| `title` | yes | Short text. |
| `description` | no | Longer text. |
| `dueAt` | yes | Date and time of the (first) occurrence, stored in UTC. |
| `timeZone` | yes | IANA time zone name, for example `Europe/Kyiv`. |
| `priority` | yes | `low`, `normal`, or `high`. Default: `normal`. |
| `tags` | no | List of strings. |
| `recurrence` | no | See 3.2. Empty means a one-time reminder. |
| `advanceNoticeMinutes` | no | Minutes before each occurrence for one additional notification. Empty means no advance notification. |
| `status` | yes | `active`, `completed`, or `archived`. |
| `snoozedUntil` | no | UTC date and time, set when the user snoozes a notification. |
| `createdAt`, `updatedAt` | yes | UTC timestamps. |
| `deletedAt` | no | Soft-delete marker, needed for sync. |
| `version` | yes | Increased by the server on every change. Used for sync. |

### 3.2 Recurrence

- **FR-REC-1.** Supported frequencies: once, daily, weekly, monthly, yearly.
- **FR-REC-2.** Weekly recurrence repeats on the weekday of `dueAt`.
- **FR-REC-3.** Monthly recurrence repeats on the same day of the month. If the month has no such day (for example the 31st), the reminder fires on the last day of that month.
- **FR-REC-4.** Yearly recurrence repeats on the same date. A reminder set for 29 February fires on 28 February in non-leap years.
- **FR-REC-5.** Occurrences are calculated in the reminder's `timeZone`, so a daily 09:00 reminder stays at 09:00 local time across daylight saving changes.
- **FR-REC-6.** Completing an occurrence of a recurring reminder moves it to the next occurrence. The user can also stop the recurrence.
- **FR-REC-7.** If a recurrence falls at a local time skipped by a daylight saving transition, move that occurrence to the nearest valid local time after the gap.
- **FR-REC-8.** If a recurrence falls at a local time that occurs twice because clocks go back, the reminder fires only at the first of the two moments.

### 3.3 Operations

- **FR-REM-1.** Create, view, edit, and delete reminders in both the desktop app and the extension.
- **FR-REM-2.** List reminders with sorting by date and priority, and filtering by tag, priority, and status.
- **FR-REM-3.** Search reminders by title and description.
- **FR-REM-4.** Mark a reminder as completed.

## 4. Notifications

- **FR-NOT-1.** When a reminder is due, the client notifies the user through the enabled channels.
- **FR-NOT-1a.** By default, notifications fire at the exact due date and time. For each reminder, the user may enable one additional advance notification with a checkbox and choose how many minutes before the occurrence it fires. The notification at the due time still fires.
- **FR-NOT-2.** Channels in the desktop app:

  | Channel | Default |
  |---|---|
  | OS system notification | on |
  | Sound | on |
  | Pop-up window | off |

  Each channel can be turned on or off in settings.
- **FR-NOT-3.** The extension shows notifications through `chrome.notifications` and schedules them with `chrome.alarms`.
- **FR-NOT-4.** From a notification the user can open the reminder, mark it as completed, or snooze it (for example 5, 15, or 60 minutes, or 1 day).
- **FR-NOT-5.** Reminders that became due while the client was not running are shown as missed when the client starts. If several occurrences of the same recurring reminder were missed, show only the latest missed notification for that reminder.
- **FR-NOT-5a.** Every running client of the account shows its own notification for a due reminder, even if another client already did. This ensures no reminder is missed. Deduplication between clients may be added later.
- **FR-NOT-6 (future).** Email notifications.
- **FR-NOT-7 (future).** Telegram notifications.

Future channels are sent by the backend, so the notification model must allow server-side delivery later.

## 5. Offline mode and sync

- **FR-SYNC-1.** Registration and the first sign-in require an internet connection. After a successful sign-in, each client keeps a local cache of the user's reminders and works fully offline: view, create, edit, delete, complete, snooze.
- **FR-SYNC-2.** Local changes that are not yet on the server are marked as **unsynced**, and the UI shows this status.
- **FR-SYNC-3.** When the connection returns, the client sends its unsynced changes and fetches changes from the server.
- **FR-SYNC-4.** The client also syncs on start, after sign-in, and periodically while online, so it does not request the server on every screen.
- **FR-SYNC-5.** Deletions are soft deletes (`deletedAt`) so they can be synced to other devices.
- **FR-SYNC-6.** Conflicts are resolved with last write wins by server-accepted `updatedAt`. This can be refined later.
- **FR-SYNC-7.** Completed, archived, and soft-deleted reminders are kept permanently as history. They are removed only when the account is deleted (see 2.2).

Local storage:

- Desktop app: SQLite in the Electron main process.
- Extension: IndexedDB.

## 6. Settings

| Setting | Default | Clients | Scope |
|---|---|---|---|
| Language | OS language | desktop, extension | device |
| Notification channels | see FR-NOT-2 | desktop | device |
| Browser notifications | on | extension | device |
| Launch at system startup | on | desktop | device |
| First day of the week | from OS locale | desktop, extension | account |
| Time format (12 or 24 hours) | from OS locale | desktop, extension | account |
| Default snooze duration | 15 minutes | desktop, extension | account |
| Usage statistics | as chosen at registration | desktop, extension | account |

- **FR-SET-1.** Device settings (language, notifications, app behavior) are stored only on the device.
- **FR-SET-2.** Account settings (date and time preferences) are stored on the server and synced to all clients of the account, like reminders.
- **FR-SET-3.** Until account settings are set, their defaults come from the OS locale.

## 7. Localization

- **FR-L10N-1.** Supported UI languages: English and Ukrainian.
- **FR-L10N-2.** On first start the app uses the OS language (the browser UI language in the extension). If that is neither English nor Ukrainian, it uses English.
- **FR-L10N-3.** The user can change the language in settings.
- **FR-L10N-4.** Dates and times are formatted for the selected language.

## 8. Desktop app

- **FR-DESK-1.** Runs on Windows, macOS, and Linux. Windows is supported first, and the other platforms follow in later versions (see [CHANGELOG.md](CHANGELOG.md)).
- **FR-DESK-2.** Lives in the system tray. Closing the main window hides it to the tray instead of quitting. The tray menu has "Open", "New reminder", and "Quit".
- **FR-DESK-3.** Launch at system startup, controlled by a setting that is on by default.
- **FR-DESK-4.** Only one instance of the app runs at a time.
- **FR-DESK-5.** Automatic updates (see 10.5).

## 9. Chrome extension

- **FR-EXT-1.** Manifest V3, Chrome only for now.
- **FR-EXT-2.** The popup lets the user view, create, and edit reminders.
- **FR-EXT-3.** Shows browser notifications for due reminders, including when the popup is closed.

## 10. Technical requirements

### 10.1 General

- Three independent projects, each with its own `package.json` and lockfile: `frontend/`, `extension/`, `backend/`.
- Language: TypeScript in all projects, with `strict` mode.
- Package manager: pnpm.
- Runtime: current Node.js LTS.
- Formatting: Prettier in all projects. Linting: ESLint with TypeScript support.
- The API contract is described in an OpenAPI document in `backend/`, available through Swagger UI in non-production environments (see 10.8). Clients keep their own types that match it.

### 10.2 Stack

| Project | Stack |
|---|---|
| `frontend/` | Electron, React, TypeScript, Vite, Zustand, SQLite |
| `extension/` | React, TypeScript, Vite, Zustand, IndexedDB |
| `backend/` | Express.js, TypeScript, Mongoose, MongoDB, dotenv, cross-env |

### 10.3 Hosting

- The backend is hosted on DigitalOcean.
- MongoDB runs in the cloud (for example MongoDB Atlas or DigitalOcean Managed MongoDB) or on the same server.
- The backend must not depend on provider-specific services, so it can move to another host. Configuration comes only from environment variables.

### 10.4 Testing

- Test runner: **Vitest** in all three projects. It works with Vite and TypeScript without extra configuration and has a Jest-compatible API. It also runs backend tests.
- Backend integration tests use Supertest against the Express app and an in-memory MongoDB (`mongodb-memory-server`).
- Integration tests are written together with the features, starting from the first endpoint.
- Recurrence, time zone, and sync logic must have unit tests, including the edge cases in 3.2. Daylight saving transitions (FR-REC-7 and FR-REC-8) must be tested for both a skipped hour and a repeated hour, in time zones of both hemispheres.
- Account deletion must have integration tests that check no user data remains on the server.

### 10.5 Build, packaging, and updates

- The desktop app is packaged with **electron-builder**: NSIS installer for Windows, DMG for macOS, AppImage and deb for Linux.
- Automatic updates use **electron-updater** with GitHub Releases as the update source.
- Release builds must be code-signed (Windows) and signed and notarized (macOS). Otherwise the OS shows security warnings and auto-update does not work on macOS.
- The extension is built with Vite into a zip archive for the Chrome Web Store.

### 10.6 CI

- GitHub Actions, with a separate job per project that runs only when that project changes.
- Each job installs dependencies, then runs format check, lint, type check, tests, and build.
- Desktop release builds run for Windows, macOS, and Linux on tag push.

### 10.7 Configuration and security

- The backend reads configuration from environment variables (`.env` in development). Secrets are never committed. Each project provides `.env.example`.
- The API is served only over HTTPS in production.
- CORS allows only the extension origin and the desktop app.
- All API input is validated.

### 10.8 Environments

| Environment | Purpose | Swagger UI | Sentry | Google Analytics |
|---|---|---|---|---|
| `local` | Development | on | off by default | off |
| `stage` | Testing before release | on | on | with consent, separate property |
| `production` | Real users | off | on | with consent |

- The environment is set by the `APP_ENV` variable (`local`, `stage`, `production`). It is separate from `NODE_ENV`, because stage runs a production build.
- Swagger UI serves the OpenAPI document at `/api/docs`. In production the route is not registered at all.
- Each environment has its own database, secrets, Sentry environment, and Google Analytics property.
- Desktop and extension builds for stage and production use the matching API URL, set at build time.

### 10.9 Error monitoring

- Sentry is used in all three projects: backend, desktop app (main and renderer processes), and extension (popup and service worker).
- Events are tagged with the environment and the release version. Source maps for release builds are uploaded to Sentry in CI.
- Events must not contain reminder content (title, description, tags), email addresses, passwords, or tokens. Sensitive data is removed before sending. Users are identified only by their internal user ID.
- Crash reports are collected on the basis of legitimate interest, are described in the Privacy Policy, and do not need separate consent.

### 10.10 Analytics

Analytics has two levels.

**Server-side metrics (all users).**

- The backend calculates aggregate metrics from its own data, for example registrations, active accounts, and created reminders.
- No data is sent to third parties for these metrics. They are described in the Privacy Policy and do not need separate consent.

**Google Analytics 4 (only with consent).**

- GA4 collects usage events in the desktop app and the extension, for example app start, sign-in, reminder created, notification action, and settings change.
- GA4 is used only while the account has consent to usage statistics (see 2.1). Before sign-in, and while consent is not given, no events are sent and no analytics client ID is stored on the device.
- When consent is withdrawn, the client stops sending events and deletes the stored analytics client ID.
- Events are sent through the GA4 Measurement Protocol. Manifest V3 does not allow remote scripts, and `gtag.js` does not work reliably in Electron.
- Events must not contain reminder content or personal data. The analytics client ID is a random value, not the email or user ID.

### 10.11 Privacy Policy

- A Privacy Policy is required before publishing the extension to the Chrome Web Store and releasing the desktop app.
- It describes what data is stored, crash reports (Sentry), server-side metrics, optional Google Analytics usage statistics, how consent is recorded and withdrawn, and how to delete the account (FR-DEL-4).
- It is available from the registration screen and from settings in both clients, and it has a version number.

## 11. Out of scope for now

- Multiple accounts in one client.
- Browsers other than Chrome.
- Email and Telegram notifications (planned, see 4).
- Email verification and password reset (planned for version 2, see 2).
- Deduplication of notifications between clients (see FR-NOT-5a).
- Multiple advance notifications for one reminder.
- Sharing reminders between users.

## 12. Open questions

- MongoDB deployment option: DigitalOcean Managed MongoDB, MongoDB Atlas, or self-hosted on DigitalOcean.