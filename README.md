# OmiReminder

OmiReminder is a cross-platform app for date-based reminders and daily checklists. The desktop app lives in the system tray, shows what is overdue, due today, and coming next, and sends one daily summary notification. Events at a specific time belong in your calendar. A Chrome extension gives access to the same reminders in the browser. Both clients work offline and sync through a shared remote backend.

See [REQUIREMENTS.md](REQUIREMENTS.md) for the full requirements.

## Features

- Date-only reminders with title, description, priority, tags, and recurrence (daily, weekly, monthly, yearly)
- Main screen with overdue reminders highlighted at the top, today's reminders by priority, and the next day that has reminders
- One daily summary notification at a locally configured time, through OS notifications, sound, and a pop-up window, each configurable
- Quick complete and reschedule to another date
- Offline mode with a local cache and automatic sync
- Email and password sign-in, with account deletion from settings
- English and Ukrainian UI
- Windows, macOS, and Linux desktop app, plus a Chrome extension

## Technology stack

| Project | Stack |
|---|---|
| Desktop app | Electron, React, TypeScript, Vite, Zustand, SQLite |
| Chrome extension | React, TypeScript, Vite, Zustand, IndexedDB (Manifest V3) |
| Backend API | Express.js, TypeScript, Mongoose, MongoDB, Swagger (OpenAPI) |

Shared tooling: pnpm, Prettier, ESLint, Vitest, Supertest, GitHub Actions. The desktop app is packaged with electron-builder.
Error monitoring uses Sentry. Optional usage analytics uses Google Analytics 4 and is enabled only with the user's consent.
The backend is hosted on DigitalOcean and remains independent of provider-specific services.

## Project structure

- `frontend/` — Electron desktop app
- `extension/` — Chrome extension
- `backend/` — REST API and data access

Each directory is an independent project with its own `package.json`.

## Status

The project is in its initial planning stage. The Windows desktop app comes first, followed by macOS, Linux, and the Chrome extension. See [CHANGELOG.md](CHANGELOG.md) for the version plan.

## License

This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Yevhen Sakara.
