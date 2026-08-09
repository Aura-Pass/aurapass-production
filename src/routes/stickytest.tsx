import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/stickytest")({ component: T });

function T() {
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="items-start gap-6 md:grid md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden md:sticky md:top-0 md:block md:h-screen md:self-start md:overflow-y-auto md:py-2">
              <Card className="p-2" style={{ borderRadius: 12 }}>
                <div id="navmark">nav</div>
              </Card>
            </aside>
            <section className="min-w-0">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="mb-3 h-16 bg-white">
                  row {i}
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
