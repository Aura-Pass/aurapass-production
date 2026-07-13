# AuraPass

Nigeria's modern event discovery and ticketing platform.

## Tech Stack
- **Frontend:** React + TypeScript (TanStack Start)
- **Backend/Auth:** Supabase (PostgreSQL + Row Level Security)
- **Payments:** Paystack
- **Email:** Resend
- **Hosting:** Cloudflare Workers (via Lovable)
- **Storage:** Supabase Storage (event banners, QR codes)

## Environment Variables
Set these in Lovable Project Settings → Secrets:

```
VITE_SUPABASE_URL=https://qryqcsnbcftcasjovtdj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
RESEND_API_KEY=your_resend_api_key
SITE_URL=https://aurapassticket.com
```

## User Roles
- **attendee** — discovers events, buys tickets, views QR codes
- **organiser** — creates events, manages ticket sales, scans QR at gate
- **admin** — moderates events, manages platform

## Database
All migrations are in `docs/build-*.sql`. Run them in chronological order against your Supabase project. See `docs/SCHEMA.md` for current table structure.

## Key Architecture Decisions
- TanStack Start file-based routing — routes live in `src/routes/`
- Dashboard layouts use parent route + `<Outlet />` pattern (see `dashboard.attendee.tsx`)
- Payments use TanStack server functions (not Supabase Edge Functions) for Cloudflare Workers compatibility
- QR codes stored in Supabase Storage under `event-banners/qr-codes/`
- Email sent via Resend using plain fetch in `src/lib/email.server.ts`
