import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Platform-wide user count for admins. Browser reads of `profiles` are
 * RLS-limited, so a head count from the client under-reports. This verifies
 * the caller holds the admin role, then counts with the service-role client.
 */
export const getPlatformUserCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error: roleError } = await (context.supabase as any).rpc(
      "get_user_roles",
      { _user_id: context.userId },
    );
    if (roleError) throw new Error("Could not verify admin role");
    const list = ((roles as any[]) ?? []).map((r) => (typeof r === "string" ? r : r?.role));
    if (!list.includes("admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(`Could not count users: ${error.message}`);
    return { users: Number(count ?? 0) };
  });
