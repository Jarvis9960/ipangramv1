/* One-off frame extractor for the Apple-style scroll journey.
 *
 * Reads the single video in public/video, extracts a dense sequence of JPGs into
 * public/frames (0001.jpg…), and prints the resulting frame count so FRAME_COUNT
 * in src/components/demo/ScrollImageSequence.js can be set to match.
 *
 * Uses the bundled static binaries (ffmpeg-static / ffprobe-static) so it works
 * without a system ffmpeg install. Run with: npm run frames
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ffmpeg = require("ffmpeg-static");
const ffprobe = require("ffprobe-static").path;

const ROOT = path.resolve(__dirname, "..");
const VIDEO_DIR = path.join(ROOT, "public", "video");
const FRAMES_DIR = path.join(ROOT, "public", "frames");

// For the smoothest Apple-style scrubbing we extract every native frame of the
// source (no downsampling = no skipped motion). MAX_FRAMES is just a safety cap
// so an unexpectedly long clip can't produce a runaway sequence; when the native
// frame count exceeds it we fall back to evenly sampling MAX_FRAMES frames.
const MAX_FRAMES = 360;

function findVideo() {
  const files = fs
    .readdirSync(VIDEO_DIR)
    .filter((f) => /\.(mp4|mov|webm|m4v)$/i.test(f));
  if (files.length === 0) {
    throw new Error(`No video found in ${VIDEO_DIR}`);
  }
  if (files.length > 1) {
    console.warn(`Multiple videos found, using the first: ${files[0]}`);
  }
  return path.join(VIDEO_DIR, files[0]);
}

function probe(video) {
  const out = execFileSync(
    ffprobe,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=r_frame_rate,nb_frames:format=duration",
      "-of",
      "default=noprint_wrappers=1",
      video,
    ],
    { encoding: "utf8" }
  );
  const get = (key) => {
    const m = out.match(new RegExp(`^${key}=(.+)$`, "m"));
    return m ? m[1].trim() : null;
  };
  const duration = parseFloat(get("duration"));
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read duration from ffprobe (got:\n${out})`);
  }
  // r_frame_rate is a fraction like "24/1".
  const rfr = get("r_frame_rate") || "0/1";
  const [num, den] = rfr.split("/").map(Number);
  const nativeFps = den ? num / den : 0;
  const nbFrames = parseInt(get("nb_frames"), 10);
  return { duration, nativeFps, nbFrames: Number.isFinite(nbFrames) ? nbFrames : null };
}

function clearFrames() {
  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
    return;
  }
  for (const f of fs.readdirSync(FRAMES_DIR)) {
    if (/\.jpe?g$/i.test(f)) fs.unlinkSync(path.join(FRAMES_DIR, f));
  }
}

function main() {
  const video = findVideo();
  console.log(`Source video : ${path.basename(video)}`);

  const { duration, nativeFps, nbFrames } = probe(video);
  const nativeFrames = nbFrames || Math.round(nativeFps * duration);
  // Default: extract every native frame (smoothest). If that would exceed the
  // safety cap, evenly sample MAX_FRAMES frames instead.
  const fps =
    nativeFrames > MAX_FRAMES
      ? Math.round((MAX_FRAMES / duration) * 100) / 100
      : nativeFps;
  console.log(`Duration     : ${duration.toFixed(2)}s`);
  console.log(`Native       : ${nativeFps} fps, ${nativeFrames} frames`);
  console.log(`Sampling fps : ${fps} (~${Math.round(fps * duration)} frames)`);

  clearFrames();

  execFileSync(
    ffmpeg,
    [
      "-i",
      video,
      "-vf",
      `fps=${fps},scale=1600:-2`,
      "-q:v",
      "3",
      path.join(FRAMES_DIR, "%04d.jpg"),
    ],
    { stdio: "inherit" }
  );

  const count = fs
    .readdirSync(FRAMES_DIR)
    .filter((f) => /\.jpe?g$/i.test(f)).length;
  console.log(`\nExtracted ${count} frames into public/frames/`);
  console.log(`-> set FRAME_COUNT = ${count} in ScrollImageSequence.js`);
}

main();
