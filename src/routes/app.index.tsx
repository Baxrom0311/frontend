import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Stethoscope, BrainCircuit, ShieldCheck, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/lib/auth-store";
import {
  adminApi,
  diagnosesApi,
  patientsApi,
  symptomsApi,
  type AdminStats,
  type Diagnosis,
} from "@/lib/api";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [counts, setCounts] = useState({ patients: 0, symptoms: 0, diagnoses: 0 });
  const [recent, setRecent] = useState<Diagnosis[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    Promise.allSettled([patientsApi.list(), symptomsApi.list(), diagnosesApi.history()]).then(
      ([p, s, d]) => {
        setCounts({
          patients: p.status === "fulfilled" ? p.value.length : 0,
          symptoms: s.status === "fulfilled" ? s.value.length : 0,
          diagnoses: d.status === "fulfilled" ? d.value.length : 0,
        });
        if (d.status === "fulfilled") setRecent(d.value.slice(0, 5));
      },
    );
    if (user?.role === "admin") {
      adminApi
        .stats()
        .then(setAdminStats)
        .catch(() => {});
    }
  }, [user]);

  const tiles = [
    {
      label: t("nav.patients"),
      value: counts.patients,
      icon: Users,
      to: "/app/patients",
      color: "from-sky-400 to-blue-500",
    },
    {
      label: t("symptoms.title"),
      value: counts.symptoms,
      icon: Stethoscope,
      to: "/app/symptoms",
      color: "from-teal-400 to-emerald-500",
    },
    {
      label: t("diagnosis.history"),
      value: counts.diagnoses,
      icon: BrainCircuit,
      to: "/app/diagnoses",
      color: "from-violet-400 to-fuchsia-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">
          {t("auth.welcomeBack")},{" "}
          <span className="text-gradient">{user?.full_name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t("app.tagline")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to}>
            <GlassCard className="hover:-translate-y-0.5 cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {tile.label}
                  </div>
                  <div className="text-3xl font-bold mt-2">{tile.value}</div>
                </div>
                <div
                  className={`size-11 rounded-2xl bg-gradient-to-br ${tile.color} flex items-center justify-center shadow-lg`}
                >
                  <tile.icon className="size-5 text-white" />
                </div>
              </div>
              <div className="mt-4 text-xs text-primary inline-flex items-center gap-1">
                {t("common.view")} <ArrowRight className="size-3" />
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {user?.role === "admin" && adminStats && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="font-semibold">{t("admin.stats")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat label={t("admin.totalUsers")} value={adminStats.total_users} />
            <Stat label={t("admin.totalPatients")} value={adminStats.total_patients} />
            <Stat label={t("admin.totalRecords")} value={adminStats.total_symptom_records} />
            <Stat label={t("admin.totalDiagnoses")} value={adminStats.total_diagnoses} />
            <Stat label={t("admin.confirmed")} value={adminStats.confirmed_diagnoses} />
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h2 className="font-semibold mb-4">{t("diagnosis.history")}</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t("common.empty")}</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {recent.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.predicted_condition}</div>
                  <div className="text-xs text-muted-foreground">
                    {(d.confidence_score * 100).toFixed(1)}% · {d.risk_level} · {d.urgency_level}
                  </div>
                </div>
                <Link
                  to="/app/diagnoses/$id"
                  params={{ id: d.id }}
                  className="text-xs text-primary hover:underline"
                >
                  {t("common.view")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-background/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
