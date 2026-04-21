import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Stethoscope } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { patientsApi, type Patient } from "@/lib/api";

export const Route = createFileRoute("/app/patients/$id")({
  component: PatientDetail,
});

function PatientDetail() {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/app/patients/$id" });
  const [p, setP] = useState<Patient | null>(null);

  useEffect(() => {
    patientsApi
      .get(id)
      .then(setP)
      .catch(() => setP(null));
  }, [id]);

  if (!p)
    return (
      <GlassCard>
        <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
      </GlassCard>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{p.full_name}</h1>
        <Button asChild className="rounded-full">
          <Link to="/app/symptoms/new" search={{ patient_id: p.id } as never}>
            <Stethoscope className="size-4 mr-1" /> {t("symptoms.new")}
          </Link>
        </Button>
      </div>
      <GlassCard>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <Field label={t("patients.dob")} value={p.date_of_birth} />
          <Field
            label={t("patients.gender")}
            value={p.gender === "male" ? t("patients.male") : t("patients.female")}
          />
          <Field label={t("patients.height")} value={p.height_cm ?? "—"} />
          <Field label={t("patients.weight")} value={p.weight_kg ?? "—"} />
          <Field
            label={t("patients.smoker")}
            value={p.smoking_status ? t("common.yes") : t("common.no")}
          />
          <Field label={t("patients.emergency")} value={p.emergency_contact ?? "—"} />
          <Field label={t("patients.chronic")} value={p.chronic_diseases.join(", ") || "—"} />
          <Field label={t("patients.allergies")} value={p.allergies.join(", ") || "—"} />
        </dl>
      </GlassCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}
