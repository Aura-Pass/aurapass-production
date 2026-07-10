import { createServerFn } from "@tanstack/react-start";

export const getPublishedEventForHead = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => {
    if (!data || typeof data.slug !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: event } = await sb
      .from("events")
      .select("id, slug, title, description, banner_url, status")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!event) return null;
    return {
      id: event.id as string,
      slug: (event.slug ?? null) as string | null,
      title: event.title as string,
      description: (event.description ?? "") as string,
      banner_url: (event.banner_url ?? null) as string | null,
    };
  });
