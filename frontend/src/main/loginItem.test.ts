import { describe, expect, it } from "vitest";
import { HIDDEN_ARGUMENT, LOGIN_ITEM_NAME, loginItemSettings } from "./loginItem";

describe("loginItemSettings", () => {
  const unpacked = "C:\\Apps\\OmiReminder\\OmiReminder.exe";

  it("registers the running executable when it is not a portable build", () => {
    expect(loginItemSettings(true, unpacked, {})).toEqual({
      openAtLogin: true,
      name: LOGIN_ITEM_NAME,
      path: unpacked,
      args: [HIDDEN_ARGUMENT],
    });
  });

  it("registers the original .exe of a portable build, not its temporary copy", () => {
    const temporary = "C:\\Users\\me\\AppData\\Local\\Temp\\3LqWSWtUp3t1gQGNggOOQzvhVeg\\OmiReminder.exe";
    const portable = "C:\\Apps\\OmiReminder-0.2.0-portable.exe";
    expect(loginItemSettings(true, temporary, { PORTABLE_EXECUTABLE_FILE: portable }).path).toBe(portable);
  });

  it("uses the same entry name for every build, so turning it off removes it", () => {
    const first = loginItemSettings(true, "C:\\Temp\\a\\OmiReminder.exe", {});
    const second = loginItemSettings(false, "C:\\Temp\\b\\OmiReminder.exe", {});
    expect(second.name).toBe(first.name);
    expect(second.openAtLogin).toBe(false);
  });
});
