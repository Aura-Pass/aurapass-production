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
  organiser_id: string;
  title: string;
  description: string;
  banner_url: string | null;
  category: string;
  venue: string;
  city: string;
  event_date: string;
  event_time: string;
  status: "pending_review" | "published" | "rejected" | "draft" | "sold_out" | "ended";
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity: number;
  quantity_sold: number;
  sale_start: string | null;
  sale_end: string | null;
  is_hidden: boolean;
  created_at: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "attendee" | "organizer" | "admin";
  avatar_url?: string;
}

export interface Order {
  id: string;
  event_id: string;
  ticket_type_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  quantity: number;
  ticket_price: number;
  platform_fee: number;
  total_amount: number;
  status: "pending" | "confirmed" | "failed" | "cancelled" | "refunded";
  paystack_reference: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  paystack_reference: string;
  amount: number;
  status: "pending" | "success" | "failed";
  paid_at: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

