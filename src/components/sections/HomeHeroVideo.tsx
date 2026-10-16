import { useEffect, useRef, useState } from "react";
import videoAsset from "../../../public/videos/hero-bg-portrait.mp4.asset.json";
import posterAsset from "../../../public/videos/poster-portrait.jpg.asset.json";
import { canPlayHomeVideo } from "@/lib/home-video-playback";

type Connection = EventTarget & { saveData?: boolean };

export function HomeHeroVideo() {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [posterReady, setPosterReady] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const panel = container.current;
    const player = video.current;
    if (!panel || !player || !posterReady) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    let inView = false;
    let blocked = false;
    let disposed = false;
    const update = () => {
      const restricted = motion.matches || Boolean(connection?.saveData);
      if (restricted) setLoadVideo(false);
      if (!blocked && canPlayHomeVideo(motion.matches, Boolean(connection?.saveData), inView, !document.hidden)) {
        setLoadVideo(true);
        if (player.getAttribute("src")) {
          void player.play().catch(() => {
            if (disposed) return;
            blocked = true;
            setPlaying(false);
          });
        }
      } else {
        player.pause();
        setPlaying(false);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      update();
    }, { threshold: 0.05 });
    // Wait until the poster has painted before observing/loading the video.
    const frame = requestAnimationFrame(() => observer.observe(panel));
    const loaded = () => update();
    player.addEventListener("loadeddata", loaded);
    motion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      player.pause();
      player.removeEventListener("loadeddata", loaded);
      motion.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [posterReady]);

  return (
    <div ref={container} className="home-hero-media" aria-hidden="true">
      <img src={posterAsset.url} alt="" fetchPriority="high" onLoad={() => setPosterReady(true)} className="home-hero-poster" />
      <video ref={video} src={loadVideo ? videoAsset.url : undefined} poster={posterAsset.url}
        muted loop playsInline autoPlay={loadVideo} preload="metadata" tabIndex={-1} aria-hidden="true"
        onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setPlaying(false)}
        className={`home-hero-video${playing ? " is-playing" : ""}`} />
    </div>
  );
}