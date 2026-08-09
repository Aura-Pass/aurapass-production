-- ============================================================
-- AuraPass — Phase 1: Artist Profiles
-- Run STEP 1 on its own first (Postgres cannot use a newly added
-- enum value inside the same transaction that adds it), then run
-- STEP 2 as a single script.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1 — add the new role to the app_role enum (RUN ALONE)
-- ------------------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'artist';


-- ------------------------------------------------------------
-- STEP 2 — table, grants, RLS, RPCs, storage bucket
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.artist_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_name       text NOT NULL,
  bio              text,
  genres           text[] NOT NULL DEFAULT '{}',
  rate_info        text,
  photo_urls       text[] NOT NULL DEFAULT '{}',
  video_links      text[] NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.artist_profiles TO authenticated;
GRANT SELECT ON public.artist_profiles TO anon;
GRANT ALL ON public.artist_profiles TO service_role;

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- Public directory: approved profiles are readable by everyone.
DROP POLICY IF EXISTS "Approved artist profiles are public" ON public.artist_profiles;
CREATE POLICY "Approved artist profiles are public"
  ON public.artist_profiles FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Applicants can always read their own row (any status).
DROP POLICY IF EXISTS "Users read own artist profile" ON public.artist_profiles;
CREATE POLICY "Users read own artist profile"
  ON public.artist_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins read everything (moderation queue).
DROP POLICY IF EXISTS "Admins read all artist profiles" ON public.artist_profiles;
CREATE POLICY "Admins read all artist profiles"
  ON public.artist_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Applicants create their own application; status must be the default.
DROP POLICY IF EXISTS "Users create own artist application" ON public.artist_profiles;
CREATE POLICY "Users create own artist application"
  ON public.artist_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending_review');

-- Applicants edit their own profile fields (status changes blocked by trigger).
DROP POLICY IF EXISTS "Users update own artist profile" ON public.artist_profiles;
CREATE POLICY "Users update own artist profile"
  ON public.artist_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Block direct status / rejection_reason changes from client updates.
-- Only the SECURITY DEFINER RPCs below may move an application.
CREATE OR REPLACE FUNCTION public.artist_profiles_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('app.artist_status_change', true), '') <> '1' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
      RAISE EXCEPTION 'Artist application status can only be changed by moderation actions';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artist_profiles_guard_status ON public.artist_profiles;
CREATE TRIGGER artist_profiles_guard_status
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.artist_profiles_guard_status();

-- ---------------- RPCs ----------------

CREATE OR REPLACE FUNCTION public.approve_artist_application(application_id uuid)
RETURNS public.artist_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.artist_profiles;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve artist applications';
  END IF;

  PERFORM set_config('app.artist_status_change', '1', true);

  UPDATE public.artist_profiles
     SET status = 'approved',
         rejection_reason = NULL,
         reviewed_at = now()
   WHERE id = application_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Artist application not found';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (result.user_id, 'artist')
  ON CONFLICT DO NOTHING;

  PERFORM set_config('app.artist_status_change', '0', true);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_artist_application(application_id uuid, reason text)
RETURNS public.artist_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.artist_profiles;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject artist applications';
  END IF;
  IF reason IS NULL OR length(trim(reason)) < 10 THEN
    RAISE EXCEPTION 'A rejection reason of at least 10 characters is required';
  END IF;

  PERFORM set_config('app.artist_status_change', '1', true);

  UPDATE public.artist_profiles
     SET status = 'rejected',
         rejection_reason = trim(reason),
         reviewed_at = now()
   WHERE id = application_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Artist application not found';
  END IF;

  PERFORM set_config('app.artist_status_change', '0', true);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.resubmit_artist_application(application_id uuid)
RETURNS public.artist_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.artist_profiles;
BEGIN
  PERFORM set_config('app.artist_status_change', '1', true);

  UPDATE public.artist_profiles
     SET status = 'pending_review',
         rejection_reason = NULL,
         reviewed_at = NULL,
         submitted_at = now()
   WHERE id = application_id
     AND user_id = auth.uid()
     AND status = 'rejected'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'No rejected application found for the current user';
  END IF;

  PERFORM set_config('app.artist_status_change', '0', true);
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_artist_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_artist_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_artist_application(uuid) TO authenticated;

-- ---------------- Storage: artist-photos ----------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-photos', 'artist-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Artist photos are public" ON storage.objects;
CREATE POLICY "Artist photos are public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artist-photos');

DROP POLICY IF EXISTS "Users upload own artist photos" ON storage.objects;
CREATE POLICY "Users upload own artist photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'artist-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own artist photos" ON storage.objects;
CREATE POLICY "Users delete own artist photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'artist-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
