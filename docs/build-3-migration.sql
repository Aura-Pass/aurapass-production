-- =========================================================
-- BUILD 3 — Events + Ticket Types
-- Run this SQL in your Supabase SQL editor for project
-- qryqcsnbcftcasjovtdj (the new project linked to .env).
-- =========================================================

-- Generic updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- ---------- events ----------
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  banner_url text,
  category text NOT NULL,
  venue text NOT NULL,
  city text NOT NULL,
  event_date date NOT NULL,
  event_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'published', 'rejected', 'draft', 'sold_out', 'ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisers can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = organiser_id);

CREATE POLICY "Organisers can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Organisers can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = organiser_id);

CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (status = 'published');

CREATE TRIGGER touch_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- ---------- ticket_types ----------
CREATE TABLE public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  quantity_sold integer NOT NULL DEFAULT 0,
  sale_start timestamptz,
  sale_end timestamptz,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
GRANT SELECT ON public.ticket_types TO anon;
GRANT ALL ON public.ticket_types TO service_role;

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisers can manage ticket types for their events"
  ON public.ticket_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_types.event_id
        AND events.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_types.event_id
        AND events.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view ticket types for published events"
  ON public.ticket_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = ticket_types.event_id
        AND events.status = 'published'
    )
  );
