import { Link } from "@tanstack/react-router";
import { Twitter, Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Discover Events", to: "/events" },
      { label: "How It Works", to: "/" },
      { label: "Pricing", to: "/" },
    ],
  },
  {
    title: "Organisers",
    links: [
      { label: "Create Event", to: "/dashboard" },
      { label: "Organiser Dashboard", to: "/dashboard" },
      { label: "Resources", to: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/" },
      { label: "Blog", to: "/" },
      { label: "Careers", to: "/" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Centre", to: "/" },
      { label: "Contact Us", to: "/" },
      { label: "Terms of Service", to: "/" },
      { label: "Privacy Policy", to: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-[#E5E7EB] bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2 space-y-3">
            <Logo />
            <p className="text-sm text-[#6B7280]">Access The Moment</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <h4 className="text-sm font-semibold text-[#111827]">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-[#6B7280] transition-colors hover:text-[#D946EF]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#E5E7EB] pt-6 md:flex-row md:items-center">
          <p className="text-xs text-[#6B7280]">© 2026 AuraPass. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a aria-label="Twitter" href="#" className="rounded-md p-2 text-[#6B7280] hover:bg-white hover:text-[#D946EF] transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
            <a aria-label="Instagram" href="#" className="rounded-md p-2 text-[#6B7280] hover:bg-white hover:text-[#D946EF] transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a aria-label="LinkedIn" href="#" className="rounded-md p-2 text-[#6B7280] hover:bg-white hover:text-[#D946EF] transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
