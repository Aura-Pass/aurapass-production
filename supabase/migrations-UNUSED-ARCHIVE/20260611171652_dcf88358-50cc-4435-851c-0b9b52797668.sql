
-- =========================================================
-- ROLES (separate table to prevent privilege escalation)
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('attendee', 'organiser', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Backfill from existing profiles.role and keep handle_new_user trigger working
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::public.app_role FROM public.profiles
WHERE role IN ('attendee','organiser','admin')
ON CONFLICT DO NOTHING;

-- Update existing signup trigger to also seed user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role text := COALESCE(NEW.raw_user_meta_data->>'role', 'attendee');
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    _role,
    true
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================
-- ORGANISERS
-- =========================================================
CREATE TABLE public.organisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  logo_url text,
  website text,
  instagram text,
  twitter text,
  is_verified boolean NOT NULL DEFAULT false,
  payout_bank_name text,
  payout_account_number text,
  payout_account_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_organisers_user ON public.organisers(user_id);
CREATE INDEX idx_organisers_slug ON public.organisers(slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisers TO authenticated;
GRANT SELECT ON public.organisers TO anon;
GRANT ALL ON public.organisers TO service_role;
ALTER TABLE public.organisers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organisers public read" ON public.organisers
  FOR SELECT USING (true);
CREATE POLICY "Organiser owner insert" ON public.organisers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'organiser'));
CREATE POLICY "Organiser owner update" ON public.organisers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage organisers" ON public.organisers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_organisers_updated BEFORE UPDATE ON public.organisers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- EVENTS
-- =========================================================
CREATE TYPE public.event_status AS ENUM ('draft','published','sold_out','cancelled','completed');
CREATE TYPE public.event_visibility AS ENUM ('public','private','unlisted');

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id uuid NOT NULL REFERENCES public.organisers(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  banner_url text,
  category text NOT NULL,
  venue text NOT NULL,
  city text NOT NULL,
  address text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  capacity int,
  status public.event_status NOT NULL DEFAULT 'draft',
  visibility public.event_visibility NOT NULL DEFAULT 'public',
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_organiser ON public.events(organiser_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_city ON public.events(city);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_start_at ON public.events(start_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events TO anon;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events public read" ON public.events
  FOR SELECT USING (status = 'published' AND visibility = 'public');
CREATE POLICY "Organiser reads own events" ON public.events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organisers o WHERE o.id = organiser_id AND o.user_id = auth.uid()));
CREATE POLICY "Organiser writes own events" ON public.events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organisers o WHERE o.id = organiser_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.organisers o WHERE o.id = organiser_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- TICKET TYPES
-- =========================================================
CREATE TABLE public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  quantity int NOT NULL CHECK (quantity >= 0),
  quantity_sold int NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  min_per_order int NOT NULL DEFAULT 1 CHECK (min_per_order >= 1),
  max_per_order int NOT NULL DEFAULT 10 CHECK (max_per_order >= 1),
  sale_start timestamptz,
  sale_end timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_types_event ON public.ticket_types(event_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
GRANT SELECT ON public.ticket_types TO anon;
GRANT ALL ON public.ticket_types TO service_role;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticket types public read" ON public.ticket_types
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e
            WHERE e.id = event_id AND e.status = 'published' AND e.visibility = 'public')
  );
CREATE POLICY "Organiser manages own ticket types" ON public.ticket_types
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e JOIN public.organisers o ON o.id = e.organiser_id
    WHERE e.id = event_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e JOIN public.organisers o ON o.id = e.organiser_id
    WHERE e.id = event_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins manage ticket types" ON public.ticket_types
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ticket_types_updated BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- ORDERS
-- =========================================================
CREATE TYPE public.order_status AS ENUM ('pending','paid','failed','refunded','cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('AP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  platform_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  status public.order_status NOT NULL DEFAULT 'pending',
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_event ON public.orders(event_id);
CREATE INDEX idx_orders_status ON public.orders(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer reads own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Buyer creates own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organiser reads event orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e JOIN public.organisers o ON o.id = e.organiser_id
    WHERE e.id = event_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TYPE public.payment_status AS ENUM ('pending','success','failed','refunded');
CREATE TYPE public.payment_provider AS ENUM ('paystack','flutterwave','manual');

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL DEFAULT 'paystack',
  provider_reference text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  status public.payment_status NOT NULL DEFAULT 'pending',
  raw_response jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_reference)
);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer reads own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- TICKETS (unique QR codes)
-- =========================================================
CREATE TYPE public.ticket_status AS ENUM ('valid','used','refunded','void');

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code text NOT NULL UNIQUE DEFAULT ('AP-TKT-' || replace(gen_random_uuid()::text,'-','')),
  attendee_name text,
  attendee_email text,
  status public.ticket_status NOT NULL DEFAULT 'valid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_order ON public.tickets(order_id);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_tickets_qr ON public.tickets(qr_code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own tickets" ON public.tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Organiser reads event tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e JOIN public.organisers o ON o.id = e.organiser_id
    WHERE e.id = event_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins manage tickets" ON public.tickets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- CHECKINS (unique per ticket prevents duplicate entry)
-- =========================================================
CREATE TABLE public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL UNIQUE REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  scanned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
CREATE INDEX idx_checkins_event ON public.checkins(event_id);
CREATE INDEX idx_checkins_scanned_by ON public.checkins(scanned_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organiser reads event checkins" ON public.checkins
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e JOIN public.organisers o ON o.id = e.organiser_id
    WHERE e.id = event_id AND o.user_id = auth.uid()));
CREATE POLICY "Organiser creates event checkins" ON public.checkins
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e JOIN public.organisers o ON o.id = e.organiser_id
    WHERE e.id = event_id AND o.user_id = auth.uid()));
CREATE POLICY "Attendee sees own checkin" ON public.checkins
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins manage checkins" ON public.checkins
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
