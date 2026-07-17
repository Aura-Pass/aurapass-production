export const PLATFORM_NAME = "AuraPass";
export const TAGLINE = "Access The Moment";

export const NAV_LINKS = [
  { label: "Discover", to: "/events" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "For Organisers", to: "/#organisers" },
] as const;

export const EVENT_CATEGORIES = [
  {
    slug: "party",
    label: "Party & Rave",
    icon: "🎉",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/party-rave.jpg",
  },
  {
    slug: "music",
    label: "Music",
    icon: "🎵",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/music.jpg",
  },
  {
    slug: "tech",
    label: "Tech & Business",
    icon: "💼",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/tech-business.jpg",
  },
  {
    slug: "food",
    label: "Food & Drink",
    icon: "🍽️",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/food-drink.jpg",
  },
  {
    slug: "sports",
    label: "Sports",
    icon: "⚽",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/sports.jpg",
  },
  {
    slug: "arts",
    label: "Arts & Culture",
    icon: "🎨",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/arts-culture.jpg",
  },
  {
    slug: "comedy",
    label: "Comedy",
    icon: "🎤",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/comedy.jpg",
  },
  {
    slug: "fashion",
    label: "Fashion",
    icon: "👗",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/fashion.jpg",
  },
  {
    slug: "gaming",
    label: "Gaming",
    icon: "🎮",
    image: "https://qryqcsnbcftcasjovtdj.supabase.co/storage/v1/object/public/assets/categories/gaming.jpg",
  },
] as const;

export const CITIES = ["Lagos", "Ilorin", "Abuja", "Port Harcourt", "Others"] as const;
