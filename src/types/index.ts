export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "attendee" | "organiser" | "admin";
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
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

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "attendee" | "organizer" | "admin";
  avatar_url?: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity: number;
  quantity_sold: number;
  sale_start: string;
  sale_end: string;
}

export interface Order {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string;
  quantity: number;
  total_amount: number;
  platform_fee: number;
  status: "pending" | "confirmed" | "refunded" | "cancelled";
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  provider: "paystack";
  provider_reference: string;
  status: "pending" | "success" | "failed";
  paid_at: string;
}
