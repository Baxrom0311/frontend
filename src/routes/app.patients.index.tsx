import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, User as UserIcon } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { patientsApi, type Patient } from "@/lib/api";

export const Route = createFileRoute("/app/patients/")({
  component: PatientsList,
});

function PatientsList() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[] | null>(null);

  useEffect(() => {
    patientsApi
      .list()
      .then(setPatients)
      .catch(() => setPatients([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("patients.title")}</h1>
          <p className="text-sm text-muted-foreground">{patients?.length ?? 0}</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/app/patients/new">
            <Plus className="size-4 mr-1" /> {t("patients.new")}
          </Link>
        </Button>
      </div>

      {patients === null ? (
        <GlassCard>
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
        </GlassCard>
      ) : patients.length === 0 ? (
        <GlassCard>
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.empty")}</p>
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <Link key={p.id} to="/app/patients/$id" params={{ id: p.id }}>
              <GlassCard className="hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                    <UserIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.gender === "male" ? t("patients.male") : t("patients.female")} ·{" "}
                      {p.date_of_birth}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
