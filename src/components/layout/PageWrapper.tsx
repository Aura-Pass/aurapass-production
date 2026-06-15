import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PageWrapper({
  children,
  showChrome = true,
}: {
  children: ReactNode;
  showChrome?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {showChrome ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      {showChrome ? <Footer /> : null}
    </div>
  );
}
