/**
 * Public equipment lister directory — approved vendor profiles only (RLS enforced).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Speaker } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { usePublicEquipmentListerProfiles } from "@/hooks/useEquipmentListers";

export const Route = createFileRoute("/equipment-listers/")({
  head: () => ({
    meta: [
      { title: "Equipment Listers | AuraPass" },
      {
        name: "description",
        content:
          "Browse verified equipment vendors on AuraPass — sound systems, lighting, stages and more for your next event.",
      },
      { property: "og:title", content: "Equipment Listers | AuraPass" },
      {
        property: "og:description",
        content: "Verified equipment vendors renting sound, lighting and stage gear in Nigeria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EquipmentListersDirectory,
});

function EquipmentListersDirectory() {
  const { listers, loading } = usePublicEquipmentListerProfiles();

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-bold text-[#111827] md:text-4xl">Equipment Listers</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Verified equipment vendors on AuraPass — browse their gear and request a booking.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" />
          </div>
        ) : listers.length === 0 ? (
          <Card className="mt-8 p-10 text-center" style={{ borderRadius: 12 }}>
            <p className="text-[#6B7280]">No equipment listers yet. Check back soon.</p>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listers.map((l) => (
              <Link
                key={l.id}
                to="/equipment-listers/$id"
                params={{ id: l.id }}
                className="group block"
              >
                <Card
                  className="overflow-hidden border border-[#E5E7EB] transition-all group-hover:-translate-y-0.5 group-hover:border-[#D946EF] group-hover:shadow-md"
                  style={{ borderRadius: 12 }}
                >
                  <div className="flex h-48 items-center justify-center bg-[#F3F4F6]">
                    {l.photo_urls?.[0] ? (
                      <img
                        src={l.photo_urls[0]}
                        alt={`${l.business_name} equipment`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Speaker className="h-8 w-8 text-[#9CA3AF]" />
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-[#111827]">{l.business_name}</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(l.equipment_categories ?? []).slice(0, 4).map((c) => (
                        <Badge key={c} className="bg-[#FDF4FF] text-[#A21CAF] hover:bg-[#FDF4FF]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
