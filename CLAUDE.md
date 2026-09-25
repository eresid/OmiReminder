# Agent Instructions

This file is the single source of truth for project instructions for all agents working in this repository. If project rules need to change, update this file.

## Workflow

- Before making changes, review the project structure and relevant files.
- Follow the existing code style and project conventions. Avoid adding unnecessary dependencies.
- Write all documentation, code comments, and Markdown (`.md`) files in English.
- Change only what is relevant to the task; do not overwrite unrelated changes.
- After making changes, run relevant checks if available and report the results.
- In your final summary, briefly explain what changed and which checks you ran.

## Project

- Requirements are in [REQUIREMENTS.md](REQUIREMENTS.md). Read the relevant sections before implementing a feature. If a change affects requirements, update that file in the same change.
- The repository has three independent projects: `frontend/` (Electron desktop app), `extension/` (Chrome extension), and `backend/` (Express API). Each has its own `package.json` and lockfile. Do not add a root workspace or share code between them through imports.
- Use pnpm. Do not use npm or yarn, and do not commit other lockfiles.
- Use TypeScript with `strict` mode in all projects.
- Use Vitest for tests. Backend integration tests use Supertest and `mongodb-memory-server`.
- Add or update tests together with the code they cover. Recurrence, time zone, and sync logic must have unit tests for edge cases.
- All user-facing strings go through localization and must have English and Ukrainian translations.
- Store dates in UTC and keep the reminder's IANA time zone separately.
- Never commit secrets. Add new environment variables to the project's `.env.example`.
- Use `APP_ENV` (`local`, `stage`, `production`) for environment-specific behavior, not `NODE_ENV`. Swagger UI must stay disabled in production.
- Never send reminder content, email addresses, passwords, or tokens to Sentry or Google Analytics.

## Checks

Run these in each project you changed:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

If a script does not exist yet, say so in your summary.

Direct user instructions and higher-priority instructions take precedence over this file.
