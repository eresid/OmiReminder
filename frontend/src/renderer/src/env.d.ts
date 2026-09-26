/// <reference types="vite/client" />

import type { OmiApi } from "../../shared/types";

declare global {
  interface Window {
    /** Exposed by the preload script. Missing when the renderer runs in a plain browser. */
    api?: OmiApi;
  }
}
