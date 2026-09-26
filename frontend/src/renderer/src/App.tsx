import { useEffect } from "react";
import { api } from "./api";
import { AllRemindersView } from "./components/AllRemindersView";
import { EditDialog } from "./components/EditDialog";
import { QuickAddDialog } from "./components/QuickAddDialog";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { TodayView } from "./components/TodayView";
import { ToastHost } from "./components/ToastHost";
import { useAppStore } from "./store";

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function App() {
  const view = useAppStore((state) => state.view);

  useEffect(() => {
    const { reload, setToday, setView, openQuickAdd } = useAppStore.getState();
    const unsubscribers = [
      api.onRemindersChanged(() => {
        void reload();
      }),
      api.onTodayChanged(setToday),
      api.onNavigate((target) => {
        if (target === "quick-add") {
          openQuickAdd();
        } else {
          setView(target);
        }
      }),
    ];

    // Ctrl+N (or Q, as in many task apps) opens quick add.
    const handleKeyDown = (event: KeyboardEvent): void => {
      const state = useAppStore.getState();
      if (state.quickAddOpen || state.editingId !== null) {
        return;
      }
      const ctrlN = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n";
      const plainQ = event.key.toLowerCase() === "q" && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (ctrlN || (plainQ && !isTyping(event.target))) {
        event.preventDefault();
        openQuickAdd();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        {view === "today" ? <TodayView /> : null}
        {view === "all" ? <AllRemindersView /> : null}
        {view === "settings" ? <SettingsView /> : null}
      </main>
      <QuickAddDialog />
      <EditDialog />
      <ToastHost />
    </div>
  );
}
