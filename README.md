# OmiReminder

OmiReminder is a cross-platform reminder app. The desktop app lives in the system tray and notifies you about upcoming events and tasks. A Chrome extension gives access to the same reminders in the browser. Both clients work offline and sync through a shared remote backend.

See [REQUIREMENTS.md](REQUIREMENTS.md) for the full requirements.

## Features

- Date-only reminders with title, description, priority, tags, and recurrence (daily, weekly, monthly, yearly)
- Notifications through OS notifications, sound, and a pop-up window, each configurable
- A locally configured daily notification time on each device
- Date-picker Snooze and missed reminder handling
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
