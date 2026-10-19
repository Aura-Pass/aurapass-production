import { createServerFn } from "@tanstack/react-start";

export const getPublishedEventForHead = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    if (!data || typeof data.slug !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    // Events created before slugs existed are linked by id — resolve either, so a
    // shared link always gets its own title + banner (never the generic site logo).
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.slug);
    let q = sb
      .from("events")
      // NOTE: `events` has no `location` column (venue + city instead). Selecting a
      // column that doesn't exist makes PostgREST error, which used to be swallowed
      // and made every shared event link fall back to the generic AuraPass logo.
      .select("id, slug, title, description, banner_url, status, event_date, venue, city")
      .eq("status", "published");
    q = isUuid ? q.or(`slug.eq.${data.slug},id.eq.${data.slug}`) : q.eq("slug", data.slug);
    const { data: event, error } = await q.maybeSingle();
    if (error) console.error("[getPublishedEventForHead] query failed", data.slug, error);
    if (!event) return null;
    return {
      id: event.id as string,
      slug: (event.slug ?? null) as string | null,
      title: event.title as string,
      description: (event.description ?? "") as string,
      banner_url: (event.banner_url ?? null) as string | null,
      event_date: (event.event_date ?? null) as string | null,
      location: null as string | null,
      venue: (event.venue ?? null) as string | null,
      city: (event.city ?? null) as string | null,
    };
  });
