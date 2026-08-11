/**
 * MediaLightbox — shared full-screen viewer for photos and video embeds.
 * Close via X button, backdrop click or Escape; prev/next with buttons and arrow keys.
 */
import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type MediaItem =
  | { kind: "image"; src: string; alt: string }
  | {
      kind: "video";
      src: string;
      title: string;
      platform: "youtube" | "instagram" | "tiktok";
    };

interface MediaLightboxProps {
  items: MediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function MediaLightbox({ items, index, onIndexChange, onClose }: MediaLightboxProps) {
  const count = items.length;
  const item = items[index];

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, go]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-[#D946EF] sm:right-5 sm:top-5"
      >
        <X className="h-6 w-6" />
      </button>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-[#D946EF] sm:left-5"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-[#D946EF] sm:right-5"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-5xl items-center justify-center"
      >
        {item.kind === "image" ? (
          <img
            src={item.src}
            alt={item.alt}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        ) : (
          <div
            className={
              item.platform === "youtube"
                ? "aspect-video w-full rounded-lg bg-black"
                : "mx-auto aspect-[9/16] max-h-[85vh] w-auto rounded-lg bg-black"
            }
            style={item.platform === "youtube" ? undefined : { height: "85vh" }}
          >
            <iframe
              src={item.src}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        )}
      </div>

      {count > 1 ? (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
          {index + 1} / {count}
        </p>
      ) : null}
    </div>
  );
}
