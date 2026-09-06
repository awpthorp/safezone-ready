import {
  Battery,
  Clapperboard,
  CircleUser,
  House,
  MessageCircle,
  Music2,
  Plus,
  Search,
  Signal,
  SquarePlay,
  Users,
  Video,
  Wifi,
} from "lucide-react";
import type { ReactNode } from "react";

export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-3 pt-1 text-[0.62rem] font-medium text-white">
      <span className="tabular-nums">9:41</span>
      <div className="flex items-center gap-1">
        <Signal className="size-3 shrink-0" />
        <Wifi className="size-3 shrink-0" />
        <Battery className="size-3 shrink-0" />
      </div>
    </div>
  );
}

export function HomeIndicator() {
  return (
    <div className="flex justify-center pb-1">
      <span className="h-1 w-24 rounded-full bg-white/80" />
    </div>
  );
}

export function AppScrims() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-(--m-top) bg-linear-to-b from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-(--m-bottom) bg-linear-to-t from-black/85 via-black/40 to-transparent" />
      <div className="absolute top-(--m-top) bottom-(--m-bottom) left-0 w-(--m-left) bg-black/20" />
      <div className="absolute top-(--m-top) bottom-(--m-bottom) right-0 w-(--m-right) bg-black/20" />
    </>
  );
}

export function RailIcon({
  icon,
  label,
  compact = false,
}: {
  icon: ReactNode;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-px">
      {icon}
      {label ? (
        <span className={`font-medium ${compact ? "text-[0.45rem]" : "text-[0.5rem]"}`}>{label}</span>
      ) : null}
    </div>
  );
}

export function IgAvatar() {
  return (
    <span className="size-7 shrink-0 rounded-full bg-linear-to-br from-amber-300 via-fuchsia-500 to-rose-500 p-px">
      <span className="block size-full rounded-full bg-zinc-800" />
    </span>
  );
}

export function GradientAvatar({ className = "size-7" }: { className?: string }) {
  return (
    <span
      className={`shrink-0 rounded-full bg-linear-to-br from-amber-300 via-fuchsia-500 to-rose-500 ${className}`}
    />
  );
}

export function TikTokFollowAvatar() {
  return (
    <div className="relative">
      <span className="block size-5 rounded-full bg-linear-to-br from-cyan-300 to-rose-500 ring-2 ring-white" />
      <span className="absolute -bottom-0.5 left-1/2 flex size-3 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500">
        <Plus className="size-2 text-white" />
      </span>
    </div>
  );
}

export function AudioCover() {
  return (
    <span className="size-6 overflow-hidden rounded-md ring-1 ring-white/40">
      <span className="block size-full bg-linear-to-br from-fuchsia-500 to-amber-400" />
    </span>
  );
}

export function SpinningDisc() {
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-zinc-900 ring-2 ring-white motion-safe:[animation:spin_4s_linear_infinite]">
      <Music2 className="size-2.5 shrink-0" />
    </span>
  );
}

export function InstagramTabBar() {
  return (
    <div className="flex items-center justify-around px-2 py-1">
      <House className="size-4 shrink-0" />
      <Search className="size-4 shrink-0" />
      <span className="flex size-5 items-center justify-center rounded-md ring-1 ring-white">
        <Plus className="size-3.5 shrink-0" />
      </span>
      <Clapperboard className="size-4 shrink-0" />
      <CircleUser className="size-4 shrink-0" />
    </div>
  );
}

export function ShortsTabBar() {
  return (
    <div className="flex items-center justify-around px-2 py-1">
      <House className="size-4 shrink-0" />
      <SquarePlay className="size-4 shrink-0" />
      <span className="flex size-5 items-center justify-center rounded-full ring-1 ring-white">
        <Plus className="size-3.5 shrink-0" />
      </span>
      <Video className="size-4 shrink-0" />
      <CircleUser className="size-4 shrink-0" />
    </div>
  );
}

export function TikTokTabBar() {
  return (
    <div className="flex items-center justify-around px-2 py-1">
      <House className="size-4 shrink-0" />
      <Users className="size-4 shrink-0" />
      <span className="flex h-5 w-7 items-center justify-center rounded-md bg-white text-zinc-950">
        <Plus className="size-3.5 shrink-0" />
      </span>
      <MessageCircle className="size-4 shrink-0" />
      <CircleUser className="size-4 shrink-0" />
    </div>
  );
}

