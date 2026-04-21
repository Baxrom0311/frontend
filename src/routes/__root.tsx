import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass rounded-3xl p-10 max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sahifa topilmadi</h2>
        <p className="mt-2 text-sm text-muted-foreground">Siz izlayotgan sahifa mavjud emas.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Bosh sahifaga
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  useTheme();
  useTranslation();
  useEffect(() => {
    const t = localStorage.getItem("cdss.theme");
    if (t === "dark") document.documentElement.classList.add("dark");
  }, []);
  return (
    <>
      <Outlet />
      <Toaster position="top-center" richColors />
    </>
  );
}
