export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "attendee" | "organiser" | "admin";
  is_approved: boolean;
  username: string | null;
  bio: string | null;
  website_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organiser_id: string;
  slug: string | null;
  title: string;
  description: string;
  banner_url: string | null;
  category: string;
  venue: string;
  city: string;
  event_date: string;
  event_time: string;
  status: "pending_review" | "published" | "rejected" | "draft" | "sold_out" | "ended";
  rejection_reason?: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  cancellation_requested_at?: string | null;
  cancellation_request_reason?: string | null;
  cancellation_status?: "requested" | "approved" | "declined" | null;
  cancellation_admin_remark?: string | null;
  ticket_types?: TicketType[];
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
  refunded_at: string | null;
  refund_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  order_id: string;
  event_id: string;
  ticket_type_id: string;
  qr_code: string;
  status: "valid" | "used" | "voided";
  checked_in_at: string | null;
  created_at: string;
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

export interface Follow {
  id: string;
  follower_id: string;
  organiser_id: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  rank: number;
}

export interface PartyMonsterEntry extends LeaderboardEntry {
  events_this_month: number;
  total_tickets_this_month: number;
}

export interface CrowdControlEntry extends LeaderboardEntry {
  group_orders_count: number;
  total_group_tickets: number;
  events_with_group_tickets: number;
}


