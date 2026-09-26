// A tiny anti-aliased rasterizer for app and tray icons. Shapes are predicates over pixel
// coordinates; each pixel is supersampled to compute its coverage.

export type Rgba = readonly [number, number, number, number];

export type Shape = (x: number, y: number) => boolean;

const SAMPLES = 4;

export class Raster {
  readonly data: Uint8ClampedArray;

  constructor(
    readonly width: number,
    readonly height: number
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  private coverage(shape: Shape, px: number, py: number): number {
    let inside = 0;
    for (let sy = 0; sy < SAMPLES; sy += 1) {
      for (let sx = 0; sx < SAMPLES; sx += 1) {
        if (shape(px + (sx + 0.5) / SAMPLES, py + (sy + 0.5) / SAMPLES)) {
          inside += 1;
        }
      }
    }
    return inside / (SAMPLES * SAMPLES);
  }

  /** Paints the shape over existing pixels (source-over blending). */
  fill(shape: Shape, color: Rgba): void {
    this.forEachCovered(shape, (offset, coverage) => {
      const sourceAlpha = (color[3] / 255) * coverage;
      const destinationAlpha = (this.data[offset + 3] ?? 0) / 255;
      const outAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
      for (let channel = 0; channel < 3; channel += 1) {
        const source = color[channel] ?? 0;
        const destination = this.data[offset + channel] ?? 0;
        this.data[offset + channel] =
          outAlpha === 0 ? 0 : (source * sourceAlpha + destination * destinationAlpha * (1 - sourceAlpha)) / outAlpha;
      }
      this.data[offset + 3] = outAlpha * 255;
    });
  }

  /** Makes the shape transparent, for example to cut a gap around a badge. */
  clear(shape: Shape): void {
    this.forEachCovered(shape, (offset, coverage) => {
      this.data[offset + 3] = (this.data[offset + 3] ?? 0) * (1 - coverage);
    });
  }

  /** Fills whole pixels, for pixel-font glyphs. */
  fillPixels(x: number, y: number, width: number, height: number, color: Rgba): void {
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        if (px >= 0 && py >= 0 && px < this.width && py < this.height) {
          this.data.set(color, (py * this.width + px) * 4);
        }
      }
    }
  }

  pixel(x: number, y: number): Rgba {
    const offset = (y * this.width + x) * 4;
    return [this.data[offset] ?? 0, this.data[offset + 1] ?? 0, this.data[offset + 2] ?? 0, this.data[offset + 3] ?? 0];
  }

  private forEachCovered(shape: Shape, paint: (offset: number, coverage: number) => void): void {
    for (let py = 0; py < this.height; py += 1) {
      for (let px = 0; px < this.width; px += 1) {
        const coverage = this.coverage(shape, px, py);
        if (coverage > 0) {
          paint((py * this.width + px) * 4, coverage);
        }
      }
    }
  }
}

export function circle(cx: number, cy: number, radius: number): Shape {
  return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

export function roundedRect(left: number, top: number, width: number, height: number, radius: number): Shape {
  return (x, y) => {
    if (x < left || y < top || x > left + width || y > top + height) {
      return false;
    }
    const dx = Math.max(left + radius - x, 0, x - (left + width - radius));
    const dy = Math.max(top + radius - y, 0, y - (top + height - radius));
    return dx ** 2 + dy ** 2 <= radius ** 2;
  };
}

/** A line segment with round caps. */
export function segment(x1: number, y1: number, x2: number, y2: number, halfWidth: number): Shape {
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  return (x, y) => {
    const t =
      lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
    const px = x1 + t * (x2 - x1);
    const py = y1 + t * (y2 - y1);
    return (x - px) ** 2 + (y - py) ** 2 <= halfWidth ** 2;
  };
}

export function union(...shapes: Shape[]): Shape {
  return (x, y) => shapes.some((shape) => shape(x, y));
}
