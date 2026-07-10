-- Build: Rejection remarks
-- Adds a rejection_reason column to events for admin moderation feedback.
alter table public.events
  add column if not exists rejection_reason text;
