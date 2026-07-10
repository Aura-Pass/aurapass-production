export interface MockEvent {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  banner_url: string;
  category: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  organizer_name: string;
  min_price: number;
  max_price: number;
  is_free: boolean;
  status: "published" | "draft" | "sold_out";
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "7",
    title: "Detty December Kickoff Party",
    description: "Lagos's most anticipated end-of-year rave. DJ sets, live performances, open bar, and vibes that go all night.",
    banner_url: "",
    category: "Party & Rave",
    venue: "Landmark Beach",
    city: "Lagos",
    date: "2026-12-05",
    time: "21:00",
    organizer_name: "Rave Republic NG",
    min_price: 15000,
    max_price: 50000,
    is_free: false,
    status: "published",
  },
  {
    id: "2",
    title: "Afrobeats Live: Lagos",
    description: "An unforgettable night of live Afrobeats performances featuring chart-topping artists.",
    banner_url: "",
    category: "Music",
    venue: "Eko Convention Centre",
    city: "Lagos",
    date: "2026-09-21",
    time: "20:00",
    organizer_name: "Aura Live",
    min_price: 10000,
    max_price: 75000,
    is_free: false,
    status: "published",
  },
  {
    id: "3",
    title: "TechLagos Founders Summit",
    description: "Network with founders, investors, and operators shaping Africa's tech ecosystem.",
    banner_url: "",
    category: "Tech & Business",
    venue: "Landmark Event Centre",
    city: "Lagos",
    date: "2026-10-12",
    time: "09:00",
    organizer_name: "TechLagos",
    min_price: 25000,
    max_price: 150000,
    is_free: false,
    status: "published",
  },
  {
    id: "4",
    title: "Open Mic Comedy Night",
    description: "An evening of raw, unfiltered laughs from Nigeria's freshest comedy talent.",
    banner_url: "",
    category: "Comedy",
    venue: "Terra Kulture",
    city: "Lagos",
    date: "2026-08-30",
    time: "19:30",
    organizer_name: "LaughLab",
    min_price: 0,
    max_price: 0,
    is_free: true,
    status: "published",
  },
  {
    id: "5",
    title: "Ilorin Food & Drink Festival",
    description: "A weekend of street food, craft drinks, and live cooking demos from top chefs.",
    banner_url: "",
    category: "Food & Drink",
    venue: "Kwara Hotels Lawn",
    city: "Ilorin",
    date: "2026-11-08",
    time: "12:00",
    organizer_name: "Taste Naija",
    min_price: 5000,
    max_price: 20000,
    is_free: false,
    status: "published",
  },
  {
    id: "6",
    title: "Abuja Fashion Week 2026",
    description: "Three days of runway shows, designer showcases, and trend forecasting.",
    banner_url: "",
    category: "Fashion",
    venue: "Transcorp Hilton",
    city: "Abuja",
    date: "2026-11-22",
    time: "18:00",
    organizer_name: "Style House Africa",
    min_price: 12000,
    max_price: 80000,
    is_free: false,
    status: "published",
  },
  {
    id: "1",
    title: "PH Sports Weekend",
    description: "A full weekend of football, basketball, and athletics competitions across PH.",
    banner_url: "",
    category: "Sports",
    venue: "Liberation Stadium",
    city: "Port Harcourt",
    date: "2026-10-25",
    time: "10:00",
    organizer_name: "PH Sports Council",
    min_price: 2000,
    max_price: 8000,
    is_free: false,
    status: "sold_out",
  },
];
