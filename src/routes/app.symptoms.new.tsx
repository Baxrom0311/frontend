import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  diagnosesApi,
  getApiErrorMessage,
  patientsApi,
  symptomsApi,
  type Patient,
} from "@/lib/api";

export const Route = createFileRoute("/app/symptoms/new")({
  validateSearch: (s: Record<string, unknown>) => ({ patient_id: (s.patient_id as string) || "" }),
  component: NewSymptom,
});

const levelOpts = ["none", "mild", "moderate", "severe"] as const;

function NewSymptom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: "/app/symptoms/new" });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patient_id: search.patient_id,
    temperature: 37.0,
    cough_type: "none" as "none" | "dry" | "wet" | "bloody",
    dyspnea_level: "none" as (typeof levelOpts)[number],
    sore_throat: false,
    runny_nose: false,
    headache_level: "none" as (typeof levelOpts)[number],
    muscle_pain: false,
    fatigue_level: 0,
    duration_days: 1,
    oxygen_saturation: "",
    heart_rate: "",
    respiratory_rate: "",
    chest_pain: false,
    loss_of_taste: false,
    diarrhea: false,
    covid_contact: false,
    smoker: false,
    notes: "",
  });

  useEffect(() => {
    patientsApi
      .list()
      .then(setPatients)
      .catch(() => setPatients([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id) {
      toast.error(t("symptoms.patient"));
      return;
    }
    setLoading(true);
    try {
      const created = await symptomsApi.create({
        ...form,
        oxygen_saturation: form.oxygen_saturation ? Number(form.oxygen_saturation) : null,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        respiratory_rate: form.respiratory_rate ? Number(form.respiratory_rate) : null,
        notes: form.notes || null,
        chronic_diseases: [],
      });
      toast.success(t("symptoms.created"));
      // Auto-create diagnosis
      const diag = await diagnosesApi.create(created.id).catch(() => null);
      if (diag) {
        navigate({ to: "/app/diagnoses/$id", params: { id: diag.id } });
      } else {
        navigate({ to: "/app/symptoms" });
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t("common.errorOccurred")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("symptoms.new")}</h1>
      <GlassCard>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label>{t("symptoms.patient")}</Label>
            <Select
              value={form.patient_id}
              onValueChange={(v) => setForm({ ...form, patient_id: v })}
            >
              <SelectTrigger className="rounded-xl bg-background/40">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("symptoms.temperature")}</Label>
              <Input
                type="number"
                step="0.1"
                min={35}
                max={42}
                required
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("symptoms.duration")}</Label>
              <Input
                type="number"
                min={1}
                max={30}
                required
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
                className="rounded-xl bg-background/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label={t("symptoms.cough")}
              value={form.cough_type}
              onChange={(v) =>
                setForm({ ...form, cough_type: v as "none" | "dry" | "wet" | "bloody" })
              }
              options={[
                { v: "none", l: t("symptoms.coughNone") },
                { v: "dry", l: t("symptoms.coughDry") },
                { v: "wet", l: t("symptoms.coughWet") },
                { v: "bloody", l: t("symptoms.coughBloody") },
              ]}
            />
            <SelectField
              label={t("symptoms.dyspnea")}
              value={form.dyspnea_level}
              onChange={(v) => setForm({ ...form, dyspnea_level: v as (typeof levelOpts)[number] })}
              options={levelOpts.map((l) => ({ v: l, l: t(`symptoms.levels.${l}`) }))}
            />
            <SelectField
              label={t("symptoms.headache")}
              value={form.headache_level}
              onChange={(v) =>
                setForm({ ...form, headache_level: v as (typeof levelOpts)[number] })
              }
              options={levelOpts.map((l) => ({ v: l, l: t(`symptoms.levels.${l}`) }))}
            />
            <div className="space-y-1.5">
              <Label>
                {t("symptoms.fatigue")}: {form.fatigue_level}
              </Label>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[form.fatigue_level]}
                onValueChange={(v) => setForm({ ...form, fatigue_level: v[0] })}
                className="py-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>{t("symptoms.spo2")}</Label>
              <Input
                type="number"
                min={70}
                max={100}
                value={form.oxygen_saturation}
                onChange={(e) => setForm({ ...form, oxygen_saturation: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("symptoms.hr")}</Label>
              <Input
                type="number"
                min={40}
                max={200}
                value={form.heart_rate}
                onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("symptoms.rr")}</Label>
              <Input
                type="number"
                min={10}
                max={60}
                value={form.respiratory_rate}
                onChange={(e) => setForm({ ...form, respiratory_rate: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Toggle
              label={t("symptoms.soreThroat")}
              value={form.sore_throat}
              onChange={(v) => setForm({ ...form, sore_throat: v })}
            />
            <Toggle
              label={t("symptoms.runnyNose")}
              value={form.runny_nose}
              onChange={(v) => setForm({ ...form, runny_nose: v })}
            />
            <Toggle
              label={t("symptoms.muscle")}
              value={form.muscle_pain}
              onChange={(v) => setForm({ ...form, muscle_pain: v })}
            />
            <Toggle
              label={t("symptoms.chestPain")}
              value={form.chest_pain}
              onChange={(v) => setForm({ ...form, chest_pain: v })}
            />
            <Toggle
              label={t("symptoms.lossOfTaste")}
              value={form.loss_of_taste}
              onChange={(v) => setForm({ ...form, loss_of_taste: v })}
            />
            <Toggle
              label={t("symptoms.diarrhea")}
              value={form.diarrhea}
              onChange={(v) => setForm({ ...form, diarrhea: v })}
            />
            <Toggle
              label={t("symptoms.covidContact")}
              value={form.covid_contact}
              onChange={(v) => setForm({ ...form, covid_contact: v })}
            />
            <Toggle
              label={t("patients.smoker")}
              value={form.smoker}
              onChange={(v) => setForm({ ...form, smoker: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("symptoms.notes")}</Label>
            <Textarea
              maxLength={1000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-xl bg-background/40"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full flex-1"
              onClick={() => navigate({ to: "/app/symptoms" })}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full flex-1">
              {loading ? t("common.loading") : t("symptoms.analyze")}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl bg-background/40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-background/40 px-3 py-2 cursor-pointer">
      <Switch checked={value} onCheckedChange={onChange} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
