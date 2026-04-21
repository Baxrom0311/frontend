import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BrainCircuit, ClipboardCheck, Stethoscope } from "lucide-react";
import { AppIcon } from "@/components/AppIcon";
import { AuroraBackground } from "@/components/AuroraBackground";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  const { user, init, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  useEffect(() => {
    if (initialized && user) navigate({ to: "/app" });
  }, [initialized, user, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraBackground />

      <header className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="size-9 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <AppIcon className="size-5 text-white" />
          </div>
          <span className="font-semibold">{t("app.name")}</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="px-6 pb-20 pt-10 lg:pt-20">
        <section className="max-w-5xl mx-auto text-center">
          <div className="inline-flex glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6 animate-fade-in">
            <span className="size-1.5 rounded-full bg-success mr-2 self-center" />
            Klinik qarorlarni qo'llab-quvvatlash tizimi
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up">
            <span className="text-gradient">Respiratory CDSS</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground animate-slide-up">
            {t("app.tagline")}. {t("auth.startSubtitle")}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-slide-up">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/login">
                {t("auth.loginCta")} <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6 glass">
              <Link to="/register">{t("auth.registerCta")}</Link>
            </Button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mt-20 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Stethoscope,
              title: t("nav.symptoms"),
              desc: "Simptomlar, hayotiy ko'rsatkichlar va anamnezni aniq kiritish.",
            },
            {
              icon: BrainCircuit,
              title: t("diagnosis.title"),
              desc: "Qoida va ML asosidagi dastlabki baholash, ishonch foizi va ogohlantirishlar.",
            },
            {
              icon: ClipboardCheck,
              title: t("diagnosis.confirmCta"),
              desc: "Shifokor natijani tasdiqlaydi va klinik izoh qo'shadi.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="glass rounded-3xl p-6 animate-fade-in hover:-translate-y-0.5 transition-transform"
            >
              <div
                className="size-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="size-5 text-white" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
