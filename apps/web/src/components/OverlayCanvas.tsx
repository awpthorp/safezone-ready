import { getOverlay, type OverlaySpec, type PlacementId } from "@safezone-ready/safezone-specs";
import { useEffect, useRef } from "react";

interface OverlayCanvasProps {
  image: HTMLImageElement;
  placementId: PlacementId;
  showOverlay: boolean;
}

export function OverlayCanvas({ image, placementId, showOverlay }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const maxW = 420;
    const scale = Math.min(1, maxW / image.width);
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (!showOverlay) {
      return;
    }

    const overlay = getOverlay(placementId, canvas.width, canvas.height);
    paintDanger(ctx, overlay);
    paintSafe(ctx, overlay);
    paintChrome(ctx, overlay, placementId);
  }, [image, placementId, showOverlay]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto max-h-[70vh] w-full rounded-lg border border-border bg-black object-contain"
      aria-label="Creative with safe-zone overlay"
    />
  );
}

function paintDanger(ctx: CanvasRenderingContext2D, overlay: OverlaySpec) {
  ctx.save();
  for (const region of overlay.danger) {
    if (region.kind === "rail") {
      ctx.fillStyle = "rgba(251, 191, 36, 0.28)";
    } else {
      ctx.fillStyle = "rgba(239, 68, 68, 0.32)";
    }
    ctx.fillRect(region.pixels.x, region.pixels.y, region.pixels.width, region.pixels.height);
  }
  ctx.restore();
}

function paintSafe(ctx: CanvasRenderingContext2D, overlay: OverlaySpec) {
  const { pixels } = overlay.safe;
  ctx.save();
  ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(pixels.x + 1, pixels.y + 1, pixels.width - 2, pixels.height - 2);
  ctx.restore();
}

function paintChrome(ctx: CanvasRenderingContext2D, overlay: OverlaySpec, placementId: PlacementId) {
  const w = overlay.canvasWidth;
  const h = overlay.canvasHeight;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `600 ${Math.max(10, Math.round(w * 0.032))}px "DM Sans", sans-serif`;

  if (placementId.startsWith("meta") || placementId === "combined" || placementId === "tiktok_infeed") {
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.roundRect(w * 0.04, h * 0.025, w * 0.42, h * 0.045, 999);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("sponsored", w * 0.12, h * 0.055);
  }

  if (placementId === "youtube_shorts" || placementId === "combined" || placementId === "tiktok_infeed" || placementId === "meta_reels") {
    const rail = overlay.danger.find((r) => r.kind === "rail") ?? overlay.danger.find((r) => r.id === "right");
    if (rail) {
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      const cx = rail.pixels.x + rail.pixels.width * 0.55;
      const labels = ["♡", "💬", "↗"];
      labels.forEach((label, i) => {
        ctx.fillText(label, cx - 8, rail.pixels.y + 28 + i * 36);
      });
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(w * 0.18, h * 0.915, w * 0.64, h * 0.038);
  ctx.fillStyle = "rgba(20,20,20,0.9)";
  ctx.font = `600 ${Math.max(10, Math.round(w * 0.028))}px "DM Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Shop now", w * 0.5, h * 0.941);
  ctx.restore();
}
