import type { AttentionCounts } from "../../shared/grouping";
import { Raster, circle, roundedRect, segment, subtract, type Rgba } from "./raster";

const WHITE: Rgba = [255, 255, 255, 255];
export const ICON_ON_LIGHT: Rgba = [20, 22, 27, 255];
export const ICON_ON_DARK: Rgba = [213, 216, 222, 255];
export const BADGE_ALERT: Rgba = [217, 48, 37, 255];
export const BADGE_NEUTRAL: Rgba = [95, 99, 104, 255];

// 3×5 pixel glyphs for the badge. "#" is a filled pixel.
const GLYPHS: Record<string, readonly string[]> = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
  "6": ["###", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "###"],
  "+": ["...", ".#.", "###", ".#.", "..."],
};

export type TrayIconTheme = "light" | "dark";

/** Draws the monochrome OmiReminder calendar mark. */
function drawMark(raster: Raster, color: Rgba): void {
  const size = raster.width;
  const stroke = size * 0.09;
  const left = size * 0.16;
  const top = size * 0.2;
  const width = size * 0.68;
  const height = size * 0.67;
  const corner = size * 0.15;
  raster.fill(
    subtract(
      roundedRect(left, top, width, height, corner),
      roundedRect(left + stroke, top + stroke, width - stroke * 2, height - stroke * 2, Math.max(0, corner - stroke))
    ),
    color
  );
  raster.fill(segment(size * 0.22, size * 0.42, size * 0.78, size * 0.42, stroke / 2), color);
  raster.fill(segment(size * 0.36, size * 0.1, size * 0.36, size * 0.29, stroke / 2), color);
  raster.fill(segment(size * 0.64, size * 0.1, size * 0.64, size * 0.29, stroke / 2), color);
}

export function renderAppIcon(size: number, theme: TrayIconTheme): Raster {
  const raster = new Raster(size, size);
  drawMark(raster, theme === "dark" ? ICON_ON_DARK : ICON_ON_LIGHT);
  return raster;
}

export interface TrayBadge {
  label: string;
  color: Rgba;
}

/** The tray badge for the attention counts, or `null` when there is nothing to show (FR-DESK-6). */
export function trayBadgeFor(counts: AttentionCounts): TrayBadge | null {
  const total = counts.overdue + counts.today;
  if (total === 0) {
    return null;
  }
  return {
    label: total > 9 ? "9+" : String(total),
    color: counts.overdue > 0 ? BADGE_ALERT : BADGE_NEUTRAL,
  };
}

export function renderTrayIcon(size: number, badge: TrayBadge | null, theme: TrayIconTheme): Raster {
  const raster = new Raster(size, size);
  drawMark(raster, theme === "dark" ? ICON_ON_DARK : ICON_ON_LIGHT);
  if (!badge) {
    return raster;
  }
  const radius = size * 0.31;
  const center = size - radius;
  raster.clear(circle(center, center, radius + size * 0.08));
  raster.fill(circle(center, center, radius), badge.color);

  const scale = Math.max(1, Math.floor(size / 16));
  const glyphs = Array.from(badge.label).map((character) => GLYPHS[character] ?? GLYPHS["0"] ?? []);
  const textWidth = glyphs.length * 3 * scale + (glyphs.length - 1) * scale;
  let x = Math.round(center - textWidth / 2);
  const y = Math.round(center - (5 * scale) / 2);
  for (const glyph of glyphs) {
    glyph.forEach((row, rowIndex) => {
      Array.from(row).forEach((cell, columnIndex) => {
        if (cell === "#") {
          raster.fillPixels(x + columnIndex * scale, y + rowIndex * scale, scale, scale, WHITE);
        }
      });
    });
    x += 4 * scale;
  }
  return raster;
}
