import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, LogOut, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { label: "Discover", to: "/events" as const },
  { label: "Tier List", to: "/leaderboard" as const },
  { label: "How It Works", to: "/how-it-works" as const },
  { label: "For Organisers", to: "/for-organisers" as const },
];

function initialsOf(profile: { username?: string | null; full_name?: string | null } | null | undefined) {
  if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
  const name = profile?.full_name;
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function displayNameOf(profile: { username?: string | null; full_name?: string | null } | null | undefined, fallback?: string | null) {
  if (profile?.username) return `@${profile.username}`;
  return profile?.full_name || fallback || "Account";
}

function dashboardPathFor(role: string | undefined) {
  if (role === "organiser") return "/dashboard/organiser" as const;
  if (role === "admin") return "/dashboard/admin" as const;
  return "/dashboard/attendee" as const;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const dashPath = dashboardPathFor(profile?.role);

  async function handleSignOut() {
    setMenuOpen(false);
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link to="/" className="flex items-center" aria-label="AuraPass home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              activeProps={{ className: "text-[#D946EF] font-semibold" }}
              className="text-sm font-medium text-[#111827] transition-colors hover:text-[#D946EF]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-[#F9FAFB]"
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D946EF] text-xs font-semibold text-white">
                  {initialsOf(profile)}
                </span>
                <span className="text-sm font-medium text-[#111827]">
                  {displayNameOf(profile, user.email)}
                </span>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg">
                  <Link
                    to={dashPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB]"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    to={dashPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB]"
                  >
                    <SettingsIcon className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 border-t border-[#E5E7EB] px-3 py-2 text-left text-sm text-[#111827] hover:bg-[#F9FAFB]"
                  >
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#111827] hover:bg-[#F3F4F6] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#E5E7EB] bg-white md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB]"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-[#E5E7EB]">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D946EF] text-xs font-semibold text-white">
                      {initialsOf(profile)}
                    </span>
                    <span className="text-sm font-medium text-[#111827]">
                      {displayNameOf(profile, user.email)}
                    </span>
                  </div>
                  <Button asChild variant="outline" size="md">
                    <Link to={dashPath} onClick={() => setOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button variant="primary" size="md" onClick={handleSignOut}>
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="md">
                    <Link to="/login" onClick={() => setOpen(false)}>Log In</Link>
                  </Button>
                  <Button asChild variant="primary" size="md">
                    <Link to="/signup" onClick={() => setOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
