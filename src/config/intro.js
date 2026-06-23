// Shared geometry for the cinematic frame-sequence intro so the scroll hook and
// the IntroSequence component agree on the size of the intro scroll band.

// Number of extracted frames in public/frames (set to the count printed by
// `npm run frames`). Frames are named 0001.jpg … {FRAME_COUNT}.jpg.
export const FRAME_COUNT = 300;

// Height of the intro scroll band in viewport heights. The taller this is, the
// slower / more luxurious the scrub. 6 => 600vh of free-scroll before the hero.
export const INTRO_VH = 6;

// Intro band height in pixels for the current viewport.
export const introHeightPx = () =>
  (typeof window !== "undefined" ? window.innerHeight : 0) * INTRO_VH;
