import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Ticket, Mic, Speaker, Trophy, ShoppingBag, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";
import { usePublicArtists } from "@/hooks/useArtists";
import equipmentImage from "@/assets/home-equipment.jpg";
import tierImage from "@/assets/home-tier-list.jpg";
import merchImage from "@/assets/home-merch.jpg";
import organiserImage from "@/assets/home-organisers.jpg";

export function HomeFeatureCarousel() {
  const { events } = usePublishedEvents();
  const { artists } = usePublicArtists();
  const event = events.find((item) => item.banner_url && !item.cancelled_at && new Date(`${item.event_date}T${item.event_time || "00:00:00"}`) > new Date());
  const artist = artists.find((item) => item.photo_urls?.length > 0);
  const features = [
    { label: "Events", title: "Find your next unforgettable night", text: "Discover events across Nigeria, from live sets to the biggest raves.", action: "Explore events", to: "/events", icon: Ticket, image: event?.banner_url, alt: event ? `${event.title} event cover` : "" },
    { label: "Artists", title: "Book the sound your event needs", text: "Discover approved performers for your next stage.", action: "Discover artists", to: "/artists", icon: Mic, image: artist?.photo_urls[0], alt: artist ? `${artist.stage_name}, approved artist` : "" },
    { label: "Equipment", title: "Bring great productions to life", text: "Sound, lighting and stage gear. Be among the first to list yours.", action: "List your gear", to: "/equipment", icon: Speaker, image: equipmentImage, alt: "Live sound equipment and mixing desk" },
    { label: "Tier List", title: "Every ticket moves you up", text: "Buy tickets to appear on the board.", action: "See the tier list", to: "/leaderboard", icon: Trophy, image: tierImage, alt: "Friends enjoying a live show" },
    { label: "Merch", title: "Take a piece of the moment home", text: "Discover event merch, with or without a ticket.", action: "Explore event merch", to: "/events", icon: ShoppingBag, image: merchImage, alt: "Event t-shirt, cap and tote bag" },
    { label: "For Organisers", title: "From first sale to final scan", text: "Bring your next event to AuraPass.", action: "For organisers", to: "/for-organisers", icon: ScanLine, image: organiserImage, alt: "An event organiser at the entrance" },
  ] as const;
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  // Start paused until the browser's motion preference is known.
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const goTo = useCallback((index: number) => {
    const next = (index + 6) % 6;
    const container = rail.current;
    const card = container?.children[next];
    if (!container || !(card instanceof HTMLElement)) return;
    container.scrollTo({ left: card.offsetLeft - container.offsetLeft, behavior: reducedMotion ? "instant" : "smooth" });
    setActive(next);
  }, [reducedMotion]);
  useEffect(() => {
    if (hovered || focused || touching || reducedMotion) return;
    const timer = window.setTimeout(() => goTo(active + 1), 5500);
    return () => window.clearTimeout(timer);
  }, [active, hovered, focused, touching, reducedMotion, goTo]);

  return (
    <section className="home-feature-carousel" aria-label="Everything around the experience" aria-roledescription="carousel" tabIndex={0}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onPointerDown={() => setTouching(true)} onPointerUp={() => setTouching(false)} onPointerCancel={() => setTouching(false)}
      onFocus={() => setFocused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
      onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); goTo(active + (e.key === "ArrowRight" ? 1 : -1)); } }}>
      <div className="mb-3 flex items-end justify-between gap-3 pr-4 md:pr-6">
        <div><p className="text-[10px] font-semibold uppercase text-primary">More than tickets</p><h2 className="mt-1 text-xl font-bold leading-tight text-foreground md:text-2xl">Everything around the experience</h2></div>
        <div className="flex shrink-0 gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" aria-label="Previous feature" title="Previous feature" onClick={() => goTo(active - 1)}><ArrowLeft /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" aria-label="Next feature" title="Next feature" onClick={() => goTo(active + 1)}><ArrowRight /></Button>
        </div>
      </div>
      <div ref={rail} className="home-feature-rail" onScroll={() => {
        const container = rail.current;
        if (!container) return;
        let closest = 0;
        let distance = Infinity;
        Array.from(container.children).forEach((child, index) => {
          if (!(child instanceof HTMLElement) || index >= 6) return;
          const delta = Math.abs(child.offsetLeft - container.offsetLeft - container.scrollLeft);
          if (delta < distance) { closest = index; distance = delta; }
        });
        setActive(closest);
      }}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return <article key={feature.label} className="home-feature-card" aria-roledescription="slide" aria-label={`${index + 1} of 6: ${feature.label}`}>
            {feature.image && <img src={feature.image} alt={feature.alt} width={960} height={512} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" className="home-feature-image" />}
            <div className={feature.label === "Events" ? "home-feature-wash home-feature-wash-strong" : "home-feature-wash"} />
            <div className="home-feature-copy">
              <span className="flex items-center gap-2 text-[11px] font-semibold"><Icon className="h-4 w-4" />{feature.label}</span>
              <h3 className="mt-3 font-heading text-2xl font-bold leading-tight md:text-3xl">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed opacity-90">{feature.text}</p>
              <Button asChild variant="link" className="mt-3 h-auto justify-start self-start rounded-none p-0 text-xs text-brand-foreground underline underline-offset-4"><Link to={feature.to}>{feature.action}<ArrowRight /></Link></Button>
            </div>
          </article>;
        })}
        <div className="home-feature-spacer" aria-hidden="true" />
      </div>
      <div className="mt-2 flex justify-center gap-1 pr-4 md:pr-6" aria-label="Choose a feature">
        {features.map((feature, index) => <Button key={feature.label} variant="ghost" className="h-6 w-8 rounded-none p-0" onClick={() => goTo(index)} aria-label={`Show ${feature.label}`} aria-current={active === index ? "true" : undefined}><span className={`h-1.5 rounded-full ${active === index ? "w-6 bg-primary" : "w-1.5 bg-border-strong"}`} /></Button>)}
      </div>
    </section>
  );
}