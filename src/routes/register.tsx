import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-store";
import { getApiErrorMessage, type LanguageCode, type UserRole } from "@/lib/api";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "patient" as UserRole,
    preferred_language: (i18n.language as LanguageCode) || "uz",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      await login(form.email, form.password);
      toast.success(t("auth.welcome"));
      navigate({ to: "/app" });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t("common.errorOccurred")));
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">{t("auth.welcome")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.startSubtitle")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>{t("auth.fullName")}</Label>
              <Input
                required
                minLength={3}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("auth.email")}</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("auth.password")}</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("auth.role")}</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as UserRole })}
                >
                  <SelectTrigger className="rounded-xl bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">{t("roles.patient")}</SelectItem>
                    <SelectItem value="doctor">{t("roles.doctor")}</SelectItem>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("auth.preferredLanguage")}</Label>
                <Select
                  value={form.preferred_language}
                  onValueChange={(v) => setForm({ ...form, preferred_language: v as LanguageCode })}
                >
                  <SelectTrigger className="rounded-xl bg-background/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uz">O'zbekcha</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
              {loading ? t("common.loading") : t("auth.registerCta")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("auth.loginCta")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
