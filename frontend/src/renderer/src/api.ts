import type { OmiApi } from "../../shared/types";
import { createMockApi } from "./mockApi";

function resolveApi(): OmiApi {
  if (window.api) {
    return window.api;
  }
  // The dev server can also be opened in a plain browser to work on the UI. It then uses an
  // in-memory API with sample data. Production builds always run inside Electron.
  if (import.meta.env.DEV) {
    return createMockApi();
  }
  throw new Error("The OmiReminder API is not available");
}

export const api = resolveApi();
