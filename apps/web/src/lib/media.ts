export const VIDEO_DECODE_ERROR =
  "We could not play that video. Try an MP4, WebM, MOV or M4V this browser can decode.";

const SEEK_TIMEOUT_MS = 2000;
const TIME_EPSILON = 0.0005;

export function createObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeIfBlob(url: string | null | undefined): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    let settled = false;
    const fail = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new Error(VIDEO_DECODE_ERROR));
    };

    const succeed = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(video);
    };

    const onMeta = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        succeed();
        return;
      }
      video.addEventListener("loadeddata", succeed);
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        succeed();
      }
    };

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("loadeddata", succeed);
      video.removeEventListener("error", fail);
    };

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("error", fail);
    video.src = src;
    video.load();
  });
}

export async function primeVideo(video: HTMLVideoElement): Promise<void> {
  video.muted = true;
  video.playsInline = true;
  try {
    const play = video.play();
    if (play !== undefined) {
      await Promise.race([
        play,
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 800);
        }),
      ]);
    }
  } catch {
    // Muted autoplay can still fail; seeking may work without it.
  }
  video.pause();
}

export function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  const duration = video.duration;
  const maxTime = Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - TIME_EPSILON) : Math.max(0, time);
  const target = Math.min(Math.max(0, time), maxTime);

  if (Number.isFinite(video.currentTime) && Math.abs(video.currentTime - target) < TIME_EPSILON) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      window.clearTimeout(timer);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const onSeeked = () => finish();
    const onError = () => finish(new Error(VIDEO_DECODE_ERROR));
    const timer = window.setTimeout(() => {
      finish(new Error("Seek timed out"));
    }, SEEK_TIMEOUT_MS);

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    try {
      video.currentTime = target;
    } catch {
      finish(new Error(VIDEO_DECODE_ERROR));
    }
  });
}

export async function attachVideoForDecode(video: HTMLVideoElement): Promise<() => void> {
  if (video.isConnected) {
    return () => undefined;
  }
  video.setAttribute("aria-hidden", "true");
  video.style.cssText =
    "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0;";
  document.body.appendChild(video);
  await primeVideo(video);
  return () => {
    video.pause();
    video.remove();
  };
}
