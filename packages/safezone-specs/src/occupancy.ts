import type { LumaImage, OccupancyMap, OverlaySpec } from "./types";

const RESIDUAL_DELTA = 24;
const LOCAL_DELTA = 80;

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

function blurRadius(image: LumaImage): number {
  return Math.max(2, Math.round(Math.min(image.width, image.height) / 40));
}

function boxBlur(image: LumaImage): Float64Array {
  const { width, height } = image;
  const stride = width + 1;
  const prefix = new Float64Array((height + 1) * stride);
  for (let y = 0; y < height; y += 1) {
    let row = 0;
    for (let x = 0; x < width; x += 1) {
      row += lumaAt(image, x, y);
      prefix[(y + 1) * stride + (x + 1)] = prefix[y * stride + (x + 1)] + row;
    }
  }

  const radius = blurRadius(image);
  const blur = new Float64Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width - 1, x + radius);
      const sum =
        prefix[(y1 + 1) * stride + (x1 + 1)] -
        prefix[y0 * stride + (x1 + 1)] -
        prefix[(y1 + 1) * stride + x0] +
        prefix[y0 * stride + x0];
      const area = (y1 - y0 + 1) * (x1 - x0 + 1);
      blur[y * width + x] = area > 0 ? sum / area : 0;
    }
  }
  return blur;
}

function clampRect(
  image: LumaImage,
  rect: { x: number; y: number; width: number; height: number },
) {
  const x0 = Math.max(0, Math.min(image.width, Math.floor(rect.x)));
  const y0 = Math.max(0, Math.min(image.height, Math.floor(rect.y)));
  const x1 = Math.max(x0, Math.min(image.width, Math.ceil(rect.x + rect.width)));
  const y1 = Math.max(y0, Math.min(image.height, Math.ceil(rect.y + rect.height)));
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 };
}

function regionMedian(
  image: LumaImage,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const samples: number[] = [];
  const step = Math.max(1, Math.floor(Math.min(x1 - x0, y1 - y0) / 16) || 1);
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      samples.push(lumaAt(image, x, y));
    }
  }
  if (samples.length === 0) {
    return 0;
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 0;
}

function peakFromRows(rowInk: Uint32Array, rowWidth: number, fill: number): number {
  const regionHeight = rowInk.length;
  const stripH = Math.max(4, Math.round(regionHeight * 0.2));
  const step = Math.max(1, Math.floor(stripH / 3));
  let peak = fill;
  for (let origin = 0; origin + stripH <= regionHeight; origin += step) {
    let strip = 0;
    for (let i = 0; i < stripH; i += 1) {
      strip += rowInk[origin + i] ?? 0;
    }
    peak = Math.max(peak, strip / (rowWidth * stripH));
  }
  return Math.max(fill, peak);
}

function regionPeaks(
  image: LumaImage,
  blur: Float64Array,
  rect: { x: number; y: number; width: number; height: number },
): { residual: number; local: number } {
  const { x0, y0, x1, y1, width, height } = clampRect(image, rect);
  const area = width * height;
  if (area <= 0) {
    return { residual: 0, local: 0 };
  }

  const local = regionMedian(image, x0, y0, x1, y1);
  const residualRows = new Uint32Array(height);
  const localRows = new Uint32Array(height);
  let residualInk = 0;
  let localInk = 0;
  for (let y = y0; y < y1; y += 1) {
    let residualRow = 0;
    let localRow = 0;
    for (let x = x0; x < x1; x += 1) {
      const luma = lumaAt(image, x, y);
      if (Math.abs(luma - (blur[y * image.width + x] ?? luma)) > RESIDUAL_DELTA) {
        residualRow += 1;
      }
      if (Math.abs(luma - local) > LOCAL_DELTA) {
        localRow += 1;
      }
    }
    residualRows[y - y0] = residualRow;
    localRows[y - y0] = localRow;
    residualInk += residualRow;
    localInk += localRow;
  }

  return {
    residual: peakFromRows(residualRows, width, residualInk / area),
    local: peakFromRows(localRows, width, localInk / area),
  };
}

function liftOccupancy(density: number): number {
  if (density <= 0.04) {
    return density;
  }
  return Math.min(1, 0.04 + (density - 0.04) * 2.2);
}

export function estimateRegionOccupancy(
  image: LumaImage,
  rect: { x: number; y: number; width: number; height: number },
): number {
  const peaks = regionPeaks(image, boxBlur(image), rect);
  return liftOccupancy(Math.max(peaks.residual, peaks.local));
}

export function estimateOverlayOccupancy(image: LumaImage, overlay: OverlaySpec): OccupancyMap {
  const blur = boxBlur(image);
  const hole = overlay.safe ? regionPeaks(image, blur, overlay.safe.pixels).residual : 0;
  const occupancy: OccupancyMap = {};
  for (const region of overlay.danger) {
    const key = region.kind === "rail" ? "rail" : region.id;
    const peaks = regionPeaks(image, blur, region.pixels);
    const extraResidual = Math.max(0, peaks.residual - hole);
    const extra =
      region.kind === "top" || region.kind === "bottom"
        ? Math.max(extraResidual, peaks.local)
        : peaks.local;
    occupancy[key] = Math.max(occupancy[key] ?? 0, liftOccupancy(extra));
  }
  return occupancy;
}
