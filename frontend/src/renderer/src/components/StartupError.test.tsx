import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { initI18n } from "../i18n";
import { StartupError } from "./StartupError";

describe("StartupError", () => {
  beforeAll(() => {
    initI18n("en");
  });

  afterEach(() => {
    cleanup();
  });

  it("explains the failure and lets the user try again", () => {
    const onRetry = vi.fn();
    render(<StartupError onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("OmiReminder could not start");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
