import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/stickytest")({ component: T });

function T() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="mb-4 flex items-center gap-3 md:hidden">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open dashboard menu" className="inline-flex h-10 w-10 items-center justify-center rounded-md border">M</button>
          </div>
          <div className="items-start gap-6 md:grid md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)] md:self-start md:overflow-y-auto md:py-2">
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
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div id="drawer" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white p-3 shadow-xl">
            <a id="navitem" href="#" onClick={(e) => { e.preventDefault(); setDrawerOpen(false); }}>Overview</a>
          </div>
        </div>
      ) : null}
    </PageWrapper>
  );
}
