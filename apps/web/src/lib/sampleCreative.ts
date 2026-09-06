export function drawSampleCreative(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a1410");
  g.addColorStop(0.45, "#3b2416");
  g.addColorStop(1, "#120e0b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#d4a017";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, w * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1410";
  ctx.font = `600 ${Math.round(w * 0.045)}px "DM Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("GLOW", w * 0.5, h * 0.43);

  ctx.fillStyle = "#f4efe6";
  ctx.font = `700 ${Math.round(w * 0.055)}px "DM Sans", sans-serif`;
  ctx.fillText("Night serum", w * 0.5, h * 0.58);

  ctx.textAlign = "left";
  ctx.font = `700 ${Math.round(w * 0.042)}px "DM Sans", sans-serif`;
  ctx.fillText("GLOW", w * 0.06, h * 0.07);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe566";
  ctx.font = `700 ${Math.round(w * 0.11)}px "DM Sans", sans-serif`;
  ctx.fillText("50% OFF", w * 0.5, h * 0.86);

  ctx.fillStyle = "#f4efe6";
  ctx.font = `600 ${Math.round(w * 0.038)}px "DM Sans", sans-serif`;
  ctx.fillText("Shop now  ·  glow.example", w * 0.5, h * 0.92);
}

export function drawFixedCreative(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#241810");
  g.addColorStop(0.5, "#3b2416");
  g.addColorStop(1, "#1a1410");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#d4a017";
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.38, w * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1410";
  ctx.font = `600 ${Math.round(w * 0.04)}px "DM Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("GLOW", w * 0.5, h * 0.39);

  ctx.fillStyle = "#f4efe6";
  ctx.font = `700 ${Math.round(w * 0.048)}px "DM Sans", sans-serif`;
  ctx.fillText("Night serum", w * 0.5, h * 0.52);

  ctx.fillStyle = "#ffe566";
  ctx.font = `700 ${Math.round(w * 0.09)}px "DM Sans", sans-serif`;
  ctx.fillText("50% OFF", w * 0.5, h * 0.61);

  ctx.fillStyle = "#f4efe6";
  ctx.font = `600 ${Math.round(w * 0.034)}px "DM Sans", sans-serif`;
  ctx.fillText("Shop now  ·  glow.example", w * 0.5, h * 0.66);
}

export async function canvasToImage(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  fileName = "sample-glow-serum.png",
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available");
  }
  draw(ctx, canvas.width, canvas.height);
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
