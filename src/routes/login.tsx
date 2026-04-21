import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppIcon } from "@/components/AppIcon";
import { AuroraBackground } from "@/components/AuroraBackground";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";
import { getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/app" }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success(t("auth.welcome"));
      navigate({ to: search.redirect });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t("common.errorOccurred")));
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <AuroraBackground />
      <header className="flex items-center justify-between p-5">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="size-9 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <AppIcon className="size-5 text-white" />
          </div>
          <span className="font-semibold">{t("app.name")}</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="glass rounded-3xl w-full max-w-md p-7 animate-scale-in">
          <h1 className="text-2xl font-bold">{t("auth.welcomeBack")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.startSubtitle")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl bg-background/40"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
              {loading ? t("common.loading") : t("auth.loginCta")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              {t("auth.registerCta")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
