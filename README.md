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

## Development

The desktop app needs Node.js 22.13 or later (Node.js 24 LTS recommended) and pnpm. Enable pnpm once with `corepack enable`, then run in `frontend/`:

- `pnpm install` installs dependencies and downloads the Electron binary.
- `pnpm dev` starts the app with hot reload. Development data is stored in `%APPDATA%\OmiReminder-dev`.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run the checks.

The renderer dev server (`http://localhost:5173`) can also be opened in a regular browser. It then uses in-memory sample data instead of the local database.

## Building the Windows app

Version 0.1 is built as a portable app that runs without installation. An installer, code signing, and automatic updates are planned for version 0.5.

1. Complete the steps in [Development](#development). `pnpm` must be available as a command, so run `corepack enable` if you have not done it yet.
2. In `frontend/`, run:

   ```bash
   pnpm package
   ```

   The first run downloads the Electron and packaging tools, so it takes a few minutes.
3. The results are in `frontend/dist/`:

   | File or folder | What it is |
   |---|---|
   | `OmiReminder-0.1.0-portable.exe` | A single file to copy anywhere and run. On each start it unpacks itself to a temporary folder, so it starts a little slower. |
   | `win-unpacked/` | The same app as a folder. Start `OmiReminder.exe` inside it. It starts faster, but the whole folder must be kept together. |

### Running the app

1. Move `OmiReminder-0.1.0-portable.exe` (or the `win-unpacked` folder) to a permanent place first, for example `%LOCALAPPDATA%\Programs\OmiReminder`. Launch at startup, which is on by default, remembers the path the app was started from, so running it from `dist/` and later deleting that folder leaves a broken startup entry.
2. Start the `.exe`. The build is not code-signed, so Windows SmartScreen may show "Windows protected your PC". Select **More info**, then **Run anyway**. This is expected until code signing is added in version 0.5.
3. The app opens its window and stays in the system tray. Closing the window hides it to the tray; use **Quit** in the tray menu to exit.

Reminders and settings are stored in `%APPDATA%\OmiReminder`, separately from development data. They are kept when you replace the `.exe` with a newer build.

### Removing the app

1. Turn off **Launch at startup** in settings, or remove OmiReminder in **Settings → Apps → Startup** in Windows.
2. Quit the app from the tray menu and delete the `.exe` or the `win-unpacked` folder.
3. To remove all reminders too, delete `%APPDATA%\OmiReminder`.

## Status

The project is in its initial planning stage. The Windows desktop app comes first, followed by macOS, Linux, and the Chrome extension. See [CHANGELOG.md](CHANGELOG.md) for the version plan.

## License

This project is licensed under the [MIT License](LICENSE). Copyright (c) 2026 Yevhen Sakara.
