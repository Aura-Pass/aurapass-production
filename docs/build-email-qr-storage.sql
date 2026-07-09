-- Build: QR codes for confirmation emails are now uploaded to Supabase Storage
-- under `event-banners/qr-codes/<ticket-id>.png` and served via public HTTPS URL
-- so Gmail (which blocks data: URIs) renders them correctly.
--
-- The `event-banners` bucket is already PUBLIC and the existing bucket-wide
-- "public read" policy already covers the `qr-codes/` subfolder — no new
-- storage.objects policy is required.
--
-- Verify with:
select id, name, public from storage.buckets where id = 'event-banners';
