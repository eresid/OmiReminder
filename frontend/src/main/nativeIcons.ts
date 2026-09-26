import { nativeImage, type NativeImage } from "electron";
import { encodePng } from "./icons/png";
import { renderAppIcon, renderTrayIcon, type TrayBadge } from "./icons/icons";
import type { Raster } from "./icons/raster";

function toPng(raster: Raster): Buffer {
  return encodePng(raster.width, raster.height, raster.data);
}

function withScales(baseSize: number, render: (size: number) => Raster): NativeImage {
  const image = nativeImage.createFromBuffer(toPng(render(baseSize)), { scaleFactor: 1 });
  for (const scaleFactor of [1.25, 1.5, 2]) {
    image.addRepresentation({
      scaleFactor,
      buffer: toPng(render(Math.round(baseSize * scaleFactor))),
    });
  }
  return image;
}

export function createAppIcon(): NativeImage {
  return withScales(64, renderAppIcon);
}

export function createTrayIcon(badge: TrayBadge | null): NativeImage {
  return withScales(16, (size) => renderTrayIcon(size, badge));
}
