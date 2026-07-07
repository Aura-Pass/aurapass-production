import { createServerFn } from "@tanstack/react-start";

export const getPublishedEventForHead = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => {
    if (!data || typeof data.id !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: event } = await sb
      .from("events")
      .select("id, title, description, banner_url, status")
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (!event) return null;
    return {
      id: event.id as string,
      title: event.title as string,
      description: (event.description ?? "") as string,
      banner_url: (event.banner_url ?? null) as string | null,
    };
  });
