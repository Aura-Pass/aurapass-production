/**
 * My Artist Profile — edit view for an approved artist's own profile.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArtistProfileForm } from "@/components/artists/ArtistProfileForm";
import { useMyArtistProfile } from "@/hooks/useArtistProfile";

export const Route = createFileRoute("/dashboard/artist/")({
  head: () => ({
    meta: [
      { title: "My Artist Profile | AuraPass" },
      {
        name: "description",
        content: "Edit your AuraPass artist profile, photos, videos and rates.",
      },
      { property: "og:title", content: "My Artist Profile | AuraPass" },
      {
        property: "og:description",
        content: "Manage how organisers see you in the AuraPass artist directory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyArtistProfilePage,
});

function MyArtistProfilePage() {
  const { application, loading, refetch } = useMyArtistProfile();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!application) {
    return (
      <Card className="p-6" style={{ borderRadius: 12 }}>
        <p className="text-sm text-[#6B7280]">You don't have an artist profile yet.</p>
        <Button asChild variant="primary" size="sm" className="mt-4">
          <Link to="/dashboard/attendee/become-artist">Apply now</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">My Artist Profile</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Changes go live in the directory immediately.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/artists/$id" params={{ id: application.id }}>
            View public profile
          </Link>
        </Button>
      </div>

      <Card className="p-6" style={{ borderRadius: 12 }}>
        <ArtistProfileForm mode="edit" existing={application} onSaved={refetch} />
      </Card>
    </div>
  );
}
