import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  children: ReactNode;
  /** Any one of these roles (from the user_roles table) grants access. */
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, activeRoles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && allowedRoles.length > 0) {
    const permitted = allowedRoles.some((r) => activeRoles.includes(r));
    if (!permitted) return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}
