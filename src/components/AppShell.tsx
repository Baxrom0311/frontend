import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  History,
  ShieldCheck,
  BrainCircuit,
  LogOut,
} from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { useAuth } from "@/lib/auth-store";
import { AuroraBackground } from "@/components/AuroraBackground";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const navItems: Array<{
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    roles?: string[];
  }> = [
    { to: "/app", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/app/patients", label: t("nav.patients"), icon: Users },
    { to: "/app/symptoms", label: t("nav.symptoms"), icon: Stethoscope },
    { to: "/app/diagnoses", label: t("nav.history"), icon: History },
    { to: "/app/admin", label: t("nav.stats"), icon: ShieldCheck, roles: ["admin"] },
    { to: "/app/admin/users", label: t("nav.users"), icon: ClipboardList, roles: ["admin"] },
    { to: "/app/admin/ml", label: t("nav.ml"), icon: BrainCircuit, roles: ["admin"] },
  ].filter((i) => !i.roles || (user && i.roles.includes(user.role)));

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col p-4">
          <div className="glass rounded-3xl flex-1 flex flex-col p-4 sticky top-4">
            <Link to="/app" className="flex items-center gap-2 px-2 py-3">
              <div
                className="size-9 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <AppIcon className="size-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">{t("app.name")}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  CDSS
                </div>
              </div>
            </Link>

            <nav className="mt-4 flex-1 space-y-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-primary/15 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border/60 pt-3 mt-3">
              <div className="px-2 pb-2">
                <div className="text-sm font-medium truncate">{user?.full_name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {user && t(`roles.${user.role}`)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => logout()}
              >
                <LogOut className="size-4" /> {t("nav.logout")}
              </Button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 px-4 lg:px-6 pt-4">
            <div className="glass rounded-2xl flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2 lg:hidden">
                <div
                  className="size-8 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <AppIcon className="size-4 text-white" />
                </div>
                <span className="text-sm font-semibold">{t("app.name")}</span>
              </div>
              <div className="hidden lg:block text-sm text-muted-foreground">
                {t("app.tagline")}
              </div>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full"
                  onClick={() => logout()}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 lg:p-6 animate-fade-in">
            <Outlet />
          </div>

          {/* Mobile bottom nav */}
          <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-30 glass rounded-2xl px-2 py-2 flex justify-around">
            {navItems.slice(0, 5).map((item) => {
              const active =
                pathname === item.to || (item.to !== "/app" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px]",
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="truncate max-w-16">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="lg:hidden h-20" />
        </main>
      </div>
    </div>
  );
}
