import type { LumaImage, OccupancyMap, OverlaySpec } from "./types";

const EDGE_THRESHOLD = 28;
const LUMA_DELTA = 18;

function lumaAt(image: LumaImage, x: number, y: number): number {
  const channels = image.channels ?? (image.data.length / (image.width * image.height) >= 4 ? 4 : 1);
  const i = (y * image.width + x) * channels;
  if (channels === 1) {
    return image.data[i] ?? 0;
  }
  const r = image.data[i] ?? 0;
  const g = image.data[i + 1] ?? 0;
  const b = image.data[i + 2] ?? 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sobel(image: LumaImage, x: number, y: number): number {
  if (x <= 0 || y <= 0 || x >= image.width - 1 || y >= image.height - 1) {
    return 0;
  }
  const tl = lumaAt(image, x - 1, y - 1);
  const t = lumaAt(image, x, y - 1);
  const tr = lumaAt(image, x + 1, y - 1);
  const l = lumaAt(image, x - 1, y);
  const r = lumaAt(image, x + 1, y);
  const bl = lumaAt(image, x - 1, y + 1);
  const b = lumaAt(image, x, y + 1);
  const br = lumaAt(image, x + 1, y + 1);
  const gx = -tl + tr - 2 * l + 2 * r - bl + br;
  const gy = -tl - 2 * t - tr + bl + 2 * b + br;
  return Math.hypot(gx, gy);
}

function borderMedian(image: LumaImage): number {
  const samples: number[] = [];
  const step = Math.max(1, Math.floor(Math.min(image.width, image.height) / 32));
  for (let x = 0; x < image.width; x += step) {
    samples.push(lumaAt(image, x, 0));
    samples.push(lumaAt(image, x, image.height - 1));
  }
  for (let y = 0; y < image.height; y += step) {
    samples.push(lumaAt(image, 0, y));
    samples.push(lumaAt(image, image.width - 1, y));
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 0;
}

export function estimateRegionOccupancy(
  image: LumaImage,
  rect: { x: number; y: number; width: number; height: number },
): number {
  const x0 = Math.max(0, Math.min(image.width, Math.floor(rect.x)));
  const y0 = Math.max(0, Math.min(image.height, Math.floor(rect.y)));
  const x1 = Math.max(x0, Math.min(image.width, Math.ceil(rect.x + rect.width)));
  const y1 = Math.max(y0, Math.min(image.height, Math.ceil(rect.y + rect.height)));
  const area = (x1 - x0) * (y1 - y0);
  if (area <= 0) {
    return 0;
  }

  const background = borderMedian(image);
  let ink = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const mag = sobel(image, x, y);
      const luma = lumaAt(image, x, y);
      if (mag > EDGE_THRESHOLD || Math.abs(luma - background) > LUMA_DELTA) {
        ink += 1;
      }
    }
  }
  return ink / area;
}

export function estimateOverlayOccupancy(image: LumaImage, overlay: OverlaySpec): OccupancyMap {
  const occupancy: OccupancyMap = {};
  for (const region of overlay.danger) {
    const key = region.kind === "rail" ? "rail" : region.id;
    const value = estimateRegionOccupancy(image, region.pixels);
    occupancy[key] = Math.max(occupancy[key] ?? 0, value);
  }
  return occupancy;
}
