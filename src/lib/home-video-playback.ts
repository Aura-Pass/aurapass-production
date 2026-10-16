export function canPlayHomeVideo(reducedMotion: boolean, saveData: boolean, inView: boolean, tabVisible: boolean) {
  return !reducedMotion && !saveData && inView && tabVisible;
}