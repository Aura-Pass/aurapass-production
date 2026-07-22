-- Cancellation request/approval workflow
alter table public.events
  add column if not exists cancellation_requested_at timestamptz;

alter table public.events
  add column if not exists cancellation_request_reason text;

alter table public.events
  add column if not exists cancellation_status text
    check (cancellation_status in ('requested', 'approved', 'declined'));

alter table public.events
  add column if not exists cancellation_admin_remark text;
