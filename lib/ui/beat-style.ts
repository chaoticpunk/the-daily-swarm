import type { Beat } from "@/lib/types";

export interface BeatStyle {
  label: string;
  shortLabel: string;
  dot: string;
  bar: string;
  avatar: string;
  wireDot: string;
}

/**
 * Static Tailwind classes by beat. Keep every class literal in this file so the
 * Tailwind scanner can see it; do not build class names by interpolation.
 */
export const BEAT_STYLE: Record<Beat, BeatStyle> = {
  near: {
    label: "NEAR desk",
    shortLabel: "NEAR",
    dot: "bg-beat-near",
    bar: "bg-beat-near",
    avatar: "border-beat-near bg-beat-near text-white",
    wireDot: "bg-beat-near-bright",
  },
  ai: {
    label: "AI desk",
    shortLabel: "AI",
    dot: "bg-beat-ai",
    bar: "bg-beat-ai",
    avatar: "border-beat-ai bg-beat-ai text-white",
    wireDot: "bg-beat-ai-bright",
  },
  markets: {
    label: "Markets desk",
    shortLabel: "Markets",
    dot: "bg-beat-markets",
    bar: "bg-beat-markets",
    avatar: "border-beat-markets bg-beat-markets text-white",
    wireDot: "bg-beat-markets-bright",
  },
};

export const BEATS: Beat[] = ["near", "ai", "markets"];

export function beatStyle(beat: Beat | null | undefined): BeatStyle | null {
  return beat ? BEAT_STYLE[beat] : null;
}
