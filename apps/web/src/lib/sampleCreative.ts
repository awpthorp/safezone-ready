const SAMPLE_STILL = "/samples/glow-serum.webp";

let sampleStill: HTMLImageElement | undefined;
let sampleStillLoading: Promise<HTMLImageElement> | undefined;

function sampleStillImage() {
  if (sampleStill) {
    return Promise.resolve(sampleStill);
  }
  sampleStillLoading ??= loadImage(SAMPLE_STILL).then((image) => {
    sampleStill = image;
    return image;
  });
  return sampleStillLoading;
}

function coverStill(ctx: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function drawWordmark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.62)";
  ctx.shadowBlur = Math.round(w * 0.014);
  ctx.fillStyle = "#f4efe6";
  ctx.font = `700 ${Math.round(w * 0.042)}px "DM Sans", sans-serif`;
  ctx.fillText("GLOW", w * 0.08, h * 0.205);
  ctx.font = `600 ${Math.round(w * 0.03)}px "DM Sans", sans-serif`;
  ctx.fillText("Night serum", w * 0.08, h * 0.236);
  ctx.shadowBlur = 0;
}

function drawOffer(ctx: CanvasRenderingContext2D, w: number, h: number, offerY: number, ctaY: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = Math.round(w * 0.02);
  ctx.fillStyle = "#ffe566";
  ctx.font = `700 ${Math.round(w * 0.11)}px "DM Sans", sans-serif`;
  ctx.fillText("50% OFF", w * 0.5, h * offerY);
  ctx.fillStyle = "#f4efe6";
  ctx.font = `600 ${Math.round(w * 0.038)}px "DM Sans", sans-serif`;
  ctx.fillText("Shop now  ·  glow.example", w * 0.5, h * ctaY);
  ctx.shadowBlur = 0;
}

export async function drawSampleCreative(ctx: CanvasRenderingContext2D, w: number, h: number) {
  coverStill(ctx, await sampleStillImage(), w, h);
  drawWordmark(ctx, w, h);
  drawOffer(ctx, w, h, 0.86, 0.92);
}

export async function drawFixedCreative(ctx: CanvasRenderingContext2D, w: number, h: number) {
  coverStill(ctx, await sampleStillImage(), w, h);
  drawWordmark(ctx, w, h);
  drawOffer(ctx, w, h, 0.6, 0.64);
}

export async function canvasToImage(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void | Promise<void>,
  fileName = "sample-glow-serum.png",
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available");
  }
  await draw(ctx, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode sample"))), "image/png");
  });
  const url = URL.createObjectURL(blob);
  const image = await loadImage(url);
  return { image, url, fileName, width: canvas.width, height: canvas.height };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("We could not read that image. Try a PNG, JPEG, or WebP."));
    image.src = src;
  });
}

export function fileFromReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read that file in the browser."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read that file in the browser."));
    reader.readAsDataURL(file);
  });
}
