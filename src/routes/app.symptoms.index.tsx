import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Stethoscope } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { symptomsApi, type SymptomRecord } from "@/lib/api";

export const Route = createFileRoute("/app/symptoms/")({
  component: SymptomsList,
});

function SymptomsList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<SymptomRecord[] | null>(null);

  useEffect(() => {
    symptomsApi
      .list()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("symptoms.title")}</h1>
        <Button asChild className="rounded-full">
          <Link to="/app/symptoms/new">
            <Plus className="size-4 mr-1" /> {t("symptoms.new")}
          </Link>
        </Button>
      </div>
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
          {items.map((s) => (
            <Link key={s.id} to="/app/symptoms/$id" params={{ id: s.id }}>
              <GlassCard className="hover:-translate-y-0.5 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-2xl bg-secondary/20 text-secondary-foreground flex items-center justify-center">
                    <Stethoscope className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {s.temperature}°C · {s.duration_days}d
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {s.cough_type !== "none" && `${t("symptoms.cough")}: ${s.cough_type}`}
                      {s.dyspnea_level !== "none" &&
                        ` · ${t("symptoms.dyspnea")}: ${s.dyspnea_level}`}
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
