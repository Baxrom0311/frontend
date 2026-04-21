import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { diagnosesApi, symptomsApi, type SymptomRecord } from "@/lib/api";

export const Route = createFileRoute("/app/symptoms/$id")({
  component: SymptomDetail,
});

function SymptomDetail() {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/app/symptoms/$id" });
  const [s, setS] = useState<SymptomRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    symptomsApi
      .get(id)
      .then(setS)
      .catch(() => setS(null));
  }, [id]);

  async function runDiagnosis() {
    setLoading(true);
    try {
      const d = await diagnosesApi.create(id, true);
      window.location.href = `/app/diagnoses/${d.id}`;
    } finally {
      setLoading(false);
    }
  }

  if (!s)
    return (
      <GlassCard>
        <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
      </GlassCard>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("symptoms.title")}</h1>
        <Button onClick={runDiagnosis} disabled={loading} className="rounded-full">
          {loading ? t("common.loading") : t("diagnosis.run")}
        </Button>
      </div>
      <GlassCard>
        <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(s, null, 2)}</pre>
      </GlassCard>
      <Link to="/app/symptoms" className="text-sm text-primary">
        ← {t("common.back")}
      </Link>
    </div>
  );
}
