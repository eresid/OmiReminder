import type { AttentionCounts } from "../../shared/grouping";
import { Raster, circle, roundedRect, segment, union, type Rgba } from "./raster";

export const ACCENT: Rgba = [66, 99, 235, 255];
const WHITE: Rgba = [255, 255, 255, 255];
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

/** The app mark: a rounded square with a check mark. */
function drawMark(raster: Raster): void {
  const size = raster.width;
  const inset = size * 0.04;
  raster.fill(roundedRect(inset, inset, size - inset * 2, size - inset * 2, size * 0.24), ACCENT);
  const halfWidth = size * 0.07;
  raster.fill(
    union(
      segment(size * 0.27, size * 0.52, size * 0.43, size * 0.68, halfWidth),
      segment(size * 0.43, size * 0.68, size * 0.73, size * 0.35, halfWidth)
    ),
    WHITE
  );
}

export function renderAppIcon(size: number): Raster {
  const raster = new Raster(size, size);
  drawMark(raster);
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

export function renderTrayIcon(size: number, badge: TrayBadge | null): Raster {
  const raster = renderAppIcon(size);
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
