import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthGate } from "@/components/AuthGate";
import { GlassCard } from "@/components/GlassCard";
import { adminApi, type AdminStats } from "@/lib/api";

export const Route = createFileRoute("/app/admin/")({
  component: () => (
    <AuthGate roles={["admin"]}>
      <AdminStatsPage />
    </AuthGate>
  ),
});

function AdminStatsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi
      .stats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats)
    return (
      <GlassCard>
        <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
      </GlassCard>
    );

  const tiles = [
    { label: t("admin.totalUsers"), value: stats.total_users },
    { label: t("admin.totalPatients"), value: stats.total_patients },
    { label: t("admin.totalRecords"), value: stats.total_symptom_records },
    { label: t("admin.totalDiagnoses"), value: stats.total_diagnoses },
    { label: t("admin.confirmed"), value: stats.confirmed_diagnoses },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.stats")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <GlassCard key={t.label}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</div>
            <div className="text-3xl font-bold mt-2">{t.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-3">{t("admin.byRole")}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(stats.users_by_role).map(([role, count]) => (
            <div key={role} className="rounded-2xl bg-background/40 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {t(`roles.${role}`, { defaultValue: role })}
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
