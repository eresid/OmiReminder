import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { resolveLanguage } from "../../shared/locale";
import { App } from "./App";
import { StartupError } from "./components/StartupError";
import { changeLanguage, initI18n } from "./i18n";
import { useAppStore } from "./store";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
const root = createRoot(rootElement);

initI18n("en");
useAppStore
  .getState()
  .init()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch(async (error: unknown) => {
    console.error(error);
    // The saved language may not have been loaded, so the error is shown in the OS language.
    await changeLanguage(resolveLanguage(navigator.languages));
    root.render(
      <StrictMode>
        <StartupError
          onRetry={() => {
            window.location.reload();
          }}
        />
      </StrictMode>
    );
  });
