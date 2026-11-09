# OmiReminder desktop app

The Electron desktop app of OmiReminder. It keeps reminders in a local SQLite database, lives in the system tray, and shows one daily summary notification. Windows is the only supported platform for now.

See the [main README](../README.md) for an overview and screenshots, [REQUIREMENTS.md](../REQUIREMENTS.md) for the requirements, and [CHANGELOG.md](../CHANGELOG.md) for the version plan.

## Requirements

- Windows 10 or 11
- Node.js 22.13 or later (Node.js 24 LTS recommended, the same version as CI)
- pnpm, the version set in `packageManager` in [package.json](package.json)

pnpm comes with Node.js through Corepack. Enable it once:

```bash
corepack enable
```

If you do not want to enable it globally, prefix every command with `corepack`, for example `corepack pnpm install`.

## Getting started

Run all commands in this `frontend/` folder.

1. Install dependencies. This also downloads the Electron binary:

   ```bash
   pnpm install
   ```

2. Start the app in development mode with hot reload:

   ```bash
   pnpm dev
   ```

The app opens its window and adds an icon to the system tray. Closing the window hides it to the tray; use **Quit** in the tray menu to stop the app. Only one instance runs at a time, so quit the app before you start another one.

### Working on the UI in a browser

`pnpm dev` also serves the renderer at `http://localhost:5173`. Opened in a regular browser, it uses an in-memory API with sample data (`src/renderer/src/mockApi.ts`) instead of the local database. Changes are not saved, and the tray, notifications, and other native features are not available.

## Scripts

| Command              | What it does                                                                    |
| -------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`           | Starts the app in development mode with hot reload.                             |
| `pnpm build`         | Builds the main, preload, and renderer code into `out/`.                        |
| `pnpm preview`       | Starts the app from the production build in `out/`.                             |
| `pnpm package`       | Generates the icon, builds the code, and packages the Windows app into `dist/`. |
| `pnpm generate:icon` | Draws `build/icon.png` from the icon code in `src/main/icons/`.                 |
| `pnpm format`        | Formats all files with Prettier.                                                |
| `pnpm format:check`  | Checks formatting without changing files.                                       |
| `pnpm lint`          | Runs ESLint.                                                                    |
| `pnpm typecheck`     | Type-checks the main and renderer code.                                         |
| `pnpm test`          | Runs all tests once.                                                            |
| `pnpm test:watch`    | Runs tests in watch mode.                                                       |

## Checks

Run these before you commit. CI runs the same checks and the build on every push and pull request that changes `frontend/` (see [.github/workflows/frontend.yml](../.github/workflows/frontend.yml)):

```bash
pnpm format:check
```

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

```bash
pnpm build
```

## Tests

Tests use Vitest and are split into two projects (see [vitest.config.ts](vitest.config.ts)):

- `main` runs tests in `src/main`, `src/preload`, and `src/shared` in Node.js. Each test file runs in its own process, because time zone tests change `process.env.TZ`.
- `renderer` runs React component and store tests in `src/renderer` in jsdom.

To run one project or one file:

```bash
pnpm test --project main
```

```bash
pnpm test src/shared/summary.test.ts
```

Date, time zone, and notification scheduling code must have tests for edge cases, including daylight saving transitions with a skipped and a repeated hour in both hemispheres. Use `withTimeZone` from `src/shared/timeZoneTestUtils.ts` to run code in a given time zone.

## Project structure

```text
frontend/
├── build/              Packaging resources: app icon and the electron-builder hook
├── scripts/            Build-time scripts, such as the icon generator
├── src/
│   ├── main/           Electron main process: window, tray, notifications, SQLite, IPC handlers
│   ├── preload/        The narrow `window.api` bridge between the renderer and the main process
│   ├── renderer/       React UI: components, Zustand store, styles
│   └── shared/         Code used by both sides: types, dates, grouping, validation, translations
├── electron-builder.yml
└── electron.vite.config.ts
```

How the parts work together:

- The renderer runs sandboxed, without Node.js. It talks to the main process only through `window.api`, defined in `src/preload/index.ts`.
- The main process validates all input from the renderer (`src/shared/validation.ts`) and stores data with `node:sqlite`.
- Database schema changes are migrations in `src/main/database.ts`. Never edit a released migration; add a new one.
- All user-facing text is in `src/shared/i18n/en.ts` and `src/shared/i18n/uk.ts`. Add every new string to both files. A test checks that the keys and Ukrainian plural forms match.

## Building the Windows app

Version 0.2 is built as an unsigned portable app that runs without installation. An installer, code signing, and automatic updates are planned for version 0.5.

```bash
pnpm package
```

The first run downloads the packaging tools, so it takes a few minutes. The results are in `dist/`:

| File or folder                       | What it is                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `OmiReminder-<version>-portable.exe` | A single file to copy anywhere and run. On each start it unpacks itself to a temporary folder, so it starts a little slower. |
| `win-unpacked/`                      | The same app as a folder. Start `OmiReminder.exe` inside it. It starts faster, but the whole folder must be kept together.   |

Packaging settings are in [electron-builder.yml](electron-builder.yml). Only the English and Ukrainian Chromium UI files are included, and `build/afterPack.cjs` replaces the 20 MB Chromium license file with a short `LICENSES.txt` that links to it.

## Running the built app

1. Move the portable `.exe` or the `win-unpacked` folder to a permanent place first, for example `%LOCALAPPDATA%\Programs\OmiReminder`. **Launch at startup** is on by default and remembers the path the app was started from, so running it from `dist/` and later deleting that folder leaves a broken startup entry.
2. Start the `.exe`. The build is not code-signed, so Windows SmartScreen may show "Windows protected your PC". Select **More info**, then **Run anyway**.
3. The app opens its window and stays in the system tray. When it is started at sign-in, it starts hidden in the tray.

To remove the app, turn off **Launch at startup** in settings, quit the app from the tray menu, and delete the `.exe` or the folder.

## Data

| Build                         | Data folder                 |
| ----------------------------- | --------------------------- |
| Built app                     | `%APPDATA%\OmiReminder`     |
| `pnpm dev` and `pnpm preview` | `%APPDATA%\OmiReminder-dev` |

Reminders, tags, and settings are in `omireminder.sqlite` in that folder. Development data is kept apart, so working on the app never changes your real reminders. Delete the folder to start with an empty database.

## Troubleshooting

- **`pnpm` is not recognized.** Run `corepack enable`, or use `corepack pnpm` instead of `pnpm`.
- **Electron failed to install or the app does not start after `pnpm install`.** Dependencies were probably installed with `--ignore-scripts`, which skips the Electron download. Delete `node_modules` and run `pnpm install` again without that flag.
- **"OmiReminder could not open its data" on start.** The database file is damaged or was saved by a newer app version. The dialog names the file. Move it away to start with an empty database.
- **Errors after updating from version 0.1.0.** Version 0.2.0 changed the database schema without a migration, so a database from 0.1.0 must be deleted (see [CHANGELOG.md](../CHANGELOG.md)).
- **The app does not seem to start at sign-in.** At sign-in it starts hidden, with only its tray icon, which Windows may put behind the `^` arrow in the taskbar. It starts only when you sign in, not when the computer wakes from sleep. Builds before 0.2.0 added a new startup entry for every build, named after the path of a temporary `OmiReminder.exe`, and these entries can start several copies at once. Open **Task Manager → Startup apps** or `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run` in Registry Editor, delete every OmiReminder entry, then start the app once to add a single entry named `OmiReminder`.
- **The app does not open a second window.** Only one instance runs at a time. Starting the app again brings the running window to the front; look for its icon in the system tray.
- **No daily notification.** Check that notifications for OmiReminder are on in Windows settings and that Focus assist (Do not disturb) is off. The summary is shown at most once a day, and only when something is overdue or due today.
