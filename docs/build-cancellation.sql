-- Event cancellation + refund tracking
alter table public.events
  add column if not exists cancelled_at timestamptz;

alter table public.events
  add column if not exists cancellation_reason text;

alter table public.orders
  add column if not exists refunded_at timestamptz;

alter table public.orders
  add column if not exists refund_reference text;
