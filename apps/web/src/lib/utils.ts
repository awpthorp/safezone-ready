import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POSTERLY_URL =
  import.meta.env.VITE_POSTERLY_URL || "https://poster.ly";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8787";

export function posterlyDownloadLink(): string {
  const url = new URL(POSTERLY_URL);
  url.searchParams.set("utm_source", "safezone-ready");
  url.searchParams.set("utm_medium", "download");
  return url.toString();
}
