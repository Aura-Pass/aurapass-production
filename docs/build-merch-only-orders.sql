-- =========================================================
-- BUILD — Merch-only orders + merch pickup QR
-- Run this SQL manually in the Supabase SQL editor.
-- =========================================================

-- 1. Allow orders without a ticket type (merch-only orders)
ALTER TABLE public.orders ALTER COLUMN ticket_type_id DROP NOT NULL;

-- Ticket orders need quantity > 0; merch-only orders have quantity = 0.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_quantity_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_quantity_check CHECK (
  (ticket_type_id IS NOT NULL AND quantity > 0)
  OR (ticket_type_id IS NULL AND quantity = 0)
);

-- 2. Merch pickup QR + collection state (one QR per order, all merch items)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS merch_qr_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS merch_pickup_status text
    CHECK (merch_pickup_status IN ('pending', 'collected')),
  ADD COLUMN IF NOT EXISTS merch_picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS merch_picked_up_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill existing ticket+merch orders so they also get a pickup QR
UPDATE public.orders o
SET merch_qr_code = 'MERCH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    merch_pickup_status = 'pending'
WHERE o.merch_qr_code IS NULL
  AND EXISTS (SELECT 1 FROM public.order_merch_items m WHERE m.order_id = o.id);

-- 3. Order validation trigger — handle null ticket_type_id
CREATE OR REPLACE FUNCTION public.validate_order_insert()
RETURNS trigger AS $$
DECLARE
  real_price numeric;
BEGIN
  IF new.ticket_type_id IS NULL THEN
    -- Merch-only: paid orders must start pending, and cannot be zero-total
    IF new.total_amount > 0 AND new.status = 'confirmed' THEN
      RAISE EXCEPTION 'Paid merch orders must start as pending';
    END IF;
    RETURN new;
  END IF;

  SELECT price INTO real_price FROM public.ticket_types WHERE id = new.ticket_type_id;
  IF real_price IS NULL THEN
    RAISE EXCEPTION 'Ticket type not found';
  END IF;
  IF real_price > 0 AND new.status = 'confirmed' THEN
    RAISE EXCEPTION 'Paid ticket orders must start as pending';
  END IF;
  IF real_price > 0 AND new.total_amount = 0 THEN
    RAISE EXCEPTION 'Total amount cannot be zero for a paid ticket';
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Scanner: mark a merch order collected (organiser, active gate attendant, or admin)
CREATE OR REPLACE FUNCTION public.mark_merch_collected(p_code text, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthorized');
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.events WHERE id = p_event_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_gate_attendants
               WHERE event_id = p_event_id AND attendant_user_id = auth.uid() AND status = 'active')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'forbidden');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE merch_qr_code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF v_order.event_id <> p_event_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'wrong_event');
  END IF;
  IF v_order.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_paid');
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('name', item_name, 'quantity', quantity)), '[]'::jsonb)
    INTO v_items FROM public.order_merch_items WHERE order_id = v_order.id;

  IF v_order.merch_pickup_status = 'collected' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_collected',
      'picked_up_at', v_order.merch_picked_up_at, 'buyer_name', v_order.buyer_name, 'items', v_items);
  END IF;

  UPDATE public.orders
     SET merch_pickup_status = 'collected', merch_picked_up_at = now(), merch_picked_up_by = auth.uid()
   WHERE id = v_order.id AND merch_pickup_status IS DISTINCT FROM 'collected';

  RETURN jsonb_build_object('ok', true, 'buyer_name', v_order.buyer_name, 'items', v_items);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_merch_collected(text, uuid) TO authenticated;

-- NOTE: if you have any scheduled job that expires abandoned pending orders,
-- make sure it only calls release_ticket_stock when ticket_type_id IS NOT NULL,
-- and still releases order_merch_items via release_merch_stock.
