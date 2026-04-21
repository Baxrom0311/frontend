import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage, patientsApi } from "@/lib/api";

export const Route = createFileRoute("/app/patients/new")({
  component: NewPatient,
});

function NewPatient() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male" as "male" | "female",
    height_cm: "",
    weight_kg: "",
    chronic: "",
    allergies: "",
    smoking_status: false,
    emergency_contact: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await patientsApi.create({
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        chronic_diseases: form.chronic
          ? form.chronic
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        allergies: form.allergies
          ? form.allergies
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        smoking_status: form.smoking_status,
        vaccination_status: {},
        emergency_contact: form.emergency_contact || null,
      });
      toast.success(t("patients.created"));
      navigate({ to: "/app/patients/$id", params: { id: created.id } });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t("common.errorOccurred")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("patients.new")}</h1>
      <GlassCard>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("patients.fullName")}</Label>
            <Input
              required
              minLength={3}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="rounded-xl bg-background/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("patients.dob")}</Label>
              <Input
                type="date"
                required
                value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("patients.gender")}</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}
              >
                <SelectTrigger className="rounded-xl bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("patients.male")}</SelectItem>
                  <SelectItem value="female">{t("patients.female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("patients.height")}</Label>
              <Input
                type="number"
                min={30}
                max={250}
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("patients.weight")}</Label>
              <Input
                type="number"
                min={1}
                max={400}
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                className="rounded-xl bg-background/40"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("patients.chronic")}</Label>
            <Input
              placeholder="asthma, diabetes"
              value={form.chronic}
              onChange={(e) => setForm({ ...form, chronic: e.target.value })}
              className="rounded-xl bg-background/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("patients.allergies")}</Label>
            <Input
              placeholder="pollen, peanuts"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="rounded-xl bg-background/40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("patients.emergency")}</Label>
            <Input
              value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
              className="rounded-xl bg-background/40"
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-background/40 px-3 py-2.5">
            <Switch
              checked={form.smoking_status}
              onCheckedChange={(v) => setForm({ ...form, smoking_status: v })}
            />
            <Label className="cursor-pointer">{t("patients.smoker")}</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full flex-1"
              onClick={() => navigate({ to: "/app/patients" })}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full flex-1">
              {loading ? t("common.loading") : t("common.create")}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
