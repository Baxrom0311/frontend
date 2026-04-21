import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, Lightbulb, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { diagnosesApi, getApiErrorMessage, type Diagnosis } from "@/lib/api";

export const Route = createFileRoute("/app/diagnoses/$id")({
  component: DiagnosisDetail,
});

function DiagnosisDetail() {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/app/diagnoses/$id" });
  const { user } = useAuth();
  const [d, setD] = useState<Diagnosis | null>(null);
  const [confirmedCondition, setConfirmedCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    diagnosesApi.get(id).then((x) => {
      setD(x);
      setConfirmedCondition(x.confirmed_condition || x.predicted_condition);
      setNotes(x.doctor_notes || "");
    });
  }, [id]);

  async function confirm() {
    setConfirming(true);
    try {
      const updated = await diagnosesApi.confirm(id, {
        confirmed_condition: confirmedCondition,
        doctor_notes: notes,
      });
      setD(updated);
      toast.success(t("diagnosis.confirmed"));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t("common.errorOccurred")));
    } finally {
      setConfirming(false);
    }
  }

  if (!d)
    return (
      <GlassCard>
        <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
      </GlassCard>
    );

  const canConfirm = user && (user.role === "doctor" || user.role === "admin");
  const confidencePct = d.confidence_score * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("diagnosis.predicted")}
          </p>
          <h1 className="text-3xl font-bold text-gradient">{d.predicted_condition}</h1>
        </div>
        {d.is_confirmed && (
          <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-success/20 text-success-foreground">
            <CheckCircle2 className="size-4" /> {t("diagnosis.confirmed")}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCard>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("diagnosis.confidence")}
          </div>
          <div className="text-2xl font-bold mt-1">{confidencePct.toFixed(1)}%</div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${confidencePct}%`, background: "var(--gradient-primary)" }}
            />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("diagnosis.risk")}
          </div>
          <div className="text-2xl font-bold mt-1 capitalize">{d.risk_level}</div>
        </GlassCard>
        <GlassCard>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("diagnosis.urgency")}
          </div>
          <div className="text-2xl font-bold mt-1 capitalize">{d.urgency_level}</div>
        </GlassCard>
      </div>

      {d.summary && (
        <GlassCard>
          <h3 className="font-semibold mb-2">{t("diagnosis.summary")}</h3>
          <p className="text-sm leading-relaxed">{d.summary}</p>
        </GlassCard>
      )}

      {d.top_predictions?.length > 0 && (
        <GlassCard>
          <h3 className="font-semibold mb-3">{t("diagnosis.top")}</h3>
          <ul className="space-y-2">
            {d.top_predictions.map((p, i) => {
              const cond = p.disease;
              const score = Math.max(0, Math.min(1, Number(p.confidence) || 0));
              return (
                <li key={i} className="flex items-center gap-3">
                  <div className="text-sm w-32 truncate">{cond}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full"
                      style={{ width: `${score * 100}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>
                  <div className="text-xs tabular-nums w-12 text-right">
                    {(score * 100).toFixed(1)}%
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      )}

      {d.rule_engine_alerts?.length > 0 && (
        <GlassCard>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" /> {t("diagnosis.alerts")}
          </h3>
          <ul className="space-y-1.5">
            {d.rule_engine_alerts.map((a, i) => (
              <li
                key={i}
                className="text-sm rounded-xl bg-warning/10 px-3 py-2 border border-warning/20"
              >
                {a}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {d.recommendations?.length > 0 && (
        <GlassCard>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="size-4 text-secondary" /> {t("diagnosis.recommendations")}
          </h3>
          <ul className="space-y-1.5">
            {d.recommendations.map((r, i) => (
              <li
                key={i}
                className="text-sm rounded-xl bg-secondary/10 px-3 py-2 border border-secondary/20"
              >
                {r}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {canConfirm && !d.is_confirmed && (
        <GlassCard>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> {t("diagnosis.confirmCta")}
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("diagnosis.confirmedCondition")}</Label>
              <Input
                value={confirmedCondition}
                onChange={(e) => setConfirmedCondition(e.target.value)}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("diagnosis.doctorNotes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl bg-background/40"
              />
            </div>
            <Button onClick={confirm} disabled={confirming} className="rounded-full">
              {confirming ? t("common.loading") : t("common.confirm")}
            </Button>
          </div>
        </GlassCard>
      )}

      {d.is_confirmed && d.confirmed_condition && (
        <GlassCard>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("diagnosis.confirmedCondition")}
          </div>
          <div className="font-semibold mt-1">{d.confirmed_condition}</div>
          {d.doctor_notes && <p className="text-sm text-muted-foreground mt-2">{d.doctor_notes}</p>}
        </GlassCard>
      )}
    </div>
  );
}
