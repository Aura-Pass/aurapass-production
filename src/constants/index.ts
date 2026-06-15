export const PLATFORM_NAME = "AuraPass";
export const TAGLINE = "Access The Moment";

export const NAV_LINKS = [
  { label: "Discover", to: "/events" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "For Organisers", to: "/#organisers" },
] as const;

export const EVENT_CATEGORIES = [
  { slug: "party", label: "Party & Rave", icon: "🎉" },
  { slug: "music", label: "Music", icon: "🎵" },
  { slug: "tech", label: "Tech & Business", icon: "💼" },
  { slug: "food", label: "Food & Drink", icon: "🍽️" },
  { slug: "sports", label: "Sports", icon: "⚽" },
  { slug: "arts", label: "Arts & Culture", icon: "🎨" },
  { slug: "comedy", label: "Comedy", icon: "🎤" },
  { slug: "fashion", label: "Fashion", icon: "👗" },
  { slug: "gaming", label: "Gaming", icon: "🎮" },
] as const;

export const CITIES = ["Lagos", "Ilorin", "Abuja", "Port Harcourt", "Others"] as const;
