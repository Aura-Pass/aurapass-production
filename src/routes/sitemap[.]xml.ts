import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://aurapassticket.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/events", changefreq: "daily", priority: "0.9" },
          { path: "/leaderboard", changefreq: "daily", priority: "0.7" },
          { path: "/for-organisers", changefreq: "monthly", priority: "0.8" },
          { path: "/how-it-works", changefreq: "monthly", priority: "0.6" },
          { path: "/pricing", changefreq: "monthly", priority: "0.6" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/help", changefreq: "monthly", priority: "0.5" },
          { path: "/blog", changefreq: "weekly", priority: "0.5" },
          { path: "/careers", changefreq: "monthly", priority: "0.4" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/signup", changefreq: "yearly", priority: "0.4" },
          { path: "/login", changefreq: "yearly", priority: "0.4" },
        ];

        const entries: SitemapEntry[] = [...staticEntries];

        try {
          const { data: events } = await (supabase as any)
            .from("events")
            .select("slug, updated_at")
            .eq("status", "published")
            .not("slug", "is", null);

          if (Array.isArray(events)) {
            for (const e of events) {
              if (!e?.slug) continue;
              entries.push({
                path: `/events/${e.slug}`,
                lastmod: e.updated_at ?? undefined,
                changefreq: "daily",
                priority: "0.8",
              });
            }
          }
        } catch (err) {
          console.error("[sitemap] failed to load events", err);
        }

        try {
          const { data: organisers } = await (supabase as any)
            .from("profiles")
            .select("username")
            .in("role", ["organiser", "admin"])
            .not("username", "is", null);

          if (Array.isArray(organisers)) {
            for (const o of organisers) {
              if (!o?.username) continue;
              entries.push({
                path: `/organisers/${o.username}`,
                changefreq: "weekly",
                priority: "0.6",
              });
            }
          }
        } catch (err) {
          console.error("[sitemap] failed to load organisers", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
