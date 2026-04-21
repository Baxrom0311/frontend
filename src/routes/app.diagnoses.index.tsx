import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertCircle, BrainCircuit } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { diagnosesApi, type Diagnosis } from "@/lib/api";

export const Route = createFileRoute("/app/diagnoses/")({
  component: DiagnosesHistory,
});

function riskClass(level: string) {
  const l = level.toLowerCase();
  if (l.includes("high") || l.includes("crit")) return "bg-destructive/15 text-destructive";
  if (l.includes("med") || l.includes("mod")) return "bg-warning/20 text-warning-foreground";
  return "bg-success/20 text-success-foreground";
}

function DiagnosesHistory() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Diagnosis[] | null>(null);

  useEffect(() => {
    diagnosesApi
      .history()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("diagnosis.history")}</h1>
      {items === null ? (
        <GlassCard>
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard>
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.empty")}</p>
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((d) => (
            <Link key={d.id} to="/app/diagnoses/$id" params={{ id: d.id }}>
              <GlassCard className="hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="size-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <BrainCircuit className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{d.predicted_condition}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {(d.confidence_score * 100).toFixed(1)}% ·{" "}
                      {new Date(d.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${riskClass(d.risk_level)}`}
                      >
                        {d.risk_level}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">
                        {d.urgency_level}
                      </span>
                      {d.is_confirmed ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success-foreground inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> {t("diagnosis.confirmed")}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted inline-flex items-center gap-1">
                          <AlertCircle className="size-3" /> {t("diagnosis.notConfirmed")}
                        </span>
                      )}
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
