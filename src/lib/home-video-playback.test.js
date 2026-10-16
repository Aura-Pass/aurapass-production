import { expect, test } from "bun:test";
import { canPlayHomeVideo } from "./home-video-playback";

test("reduced motion prevents video playback", () => {
  expect(canPlayHomeVideo(true, false, true, true)).toBe(false);
});
test("Data Saver prevents video playback", () => {
  expect(canPlayHomeVideo(false, true, true, true)).toBe(false);
});
test("offscreen video pauses", () => {
  expect(canPlayHomeVideo(false, false, false, true)).toBe(false);
});
test("hidden tab pauses and visible tab resumes", () => {
  expect(canPlayHomeVideo(false, false, true, false)).toBe(false);
  expect(canPlayHomeVideo(false, false, true, true)).toBe(true);
});