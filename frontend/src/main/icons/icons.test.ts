import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ACCENT, BADGE_ALERT, BADGE_NEUTRAL, renderAppIcon, renderTrayIcon, trayBadgeFor } from "./icons";
import { encodePng } from "./png";

describe("tray badge", () => {
  it("is hidden when nothing needs attention", () => {
    expect(trayBadgeFor({ overdue: 0, today: 0 })).toBeNull();
  });

  it("is red when anything is overdue and neutral otherwise", () => {
    expect(trayBadgeFor({ overdue: 1, today: 2 })).toEqual({ label: "3", color: BADGE_ALERT });
    expect(trayBadgeFor({ overdue: 0, today: 2 })).toEqual({ label: "2", color: BADGE_NEUTRAL });
  });

  it("shows 9+ above nine", () => {
    expect(trayBadgeFor({ overdue: 4, today: 6 })?.label).toBe("9+");
  });
});

describe("icon rendering", () => {
  it("draws the app mark with transparent corners", () => {
    const icon = renderAppIcon(32);
    expect(icon.pixel(0, 0)[3]).toBe(0);
    expect(icon.pixel(6, 6)).toEqual(ACCENT);
  });

  it("draws the badge in the bottom-right corner", () => {
    const plain = renderTrayIcon(32, null);
    const badged = renderTrayIcon(32, { label: "3", color: BADGE_ALERT });
    expect(plain.pixel(24, 20)).toEqual(ACCENT);
    // The badge edge is red, and the top-left of the mark is unchanged.
    expect(badged.pixel(24, 16)).toEqual(BADGE_ALERT);
    expect(badged.pixel(6, 6)).toEqual(ACCENT);
  });
});

describe("PNG encoding", () => {
  it("writes a valid header and the pixel rows", () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 128]);
    const png = encodePng(2, 1, pixels);
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.toString("ascii", 12, 16)).toBe("IHDR");
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(1);

    const idatLength = png.readUInt32BE(33);
    expect(png.toString("ascii", 37, 41)).toBe("IDAT");
    const raw = inflateSync(png.subarray(41, 41 + idatLength));
    expect([...raw]).toEqual([0, 255, 0, 0, 255, 0, 0, 255, 128]);
  });

  it("rejects pixel data of the wrong size", () => {
    expect(() => encodePng(2, 2, new Uint8ClampedArray(4))).toThrow(RangeError);
  });
});
