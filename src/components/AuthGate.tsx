import { useEffect } from "react";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import type { UserRole } from "@/lib/api";

export function AuthGate({ roles, children }: { roles?: UserRole[]; children?: React.ReactNode }) {
  const { user, initialized, init } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  useEffect(() => {
    if (initialized && !user) {
      navigate({ to: "/login", search: { redirect: location.pathname } as never });
    }
  }, [initialized, user, navigate, location.pathname]);

  if (!initialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass rounded-3xl p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold">403</h2>
          <p className="text-muted-foreground mt-2">Bu sahifaga ruxsatingiz yo'q.</p>
        </div>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
