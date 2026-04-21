import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { adminApi, getApiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/app/admin/ml")({
  component: () => (
    <AuthGate roles={["admin"]}>
      <MLPage />
    </AuthGate>
  ),
});

function MLPage() {
  const { t } = useTranslation();
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [retraining, setRetraining] = useState(false);

  function load() {
    adminApi
      .modelMeta()
      .then(setMeta)
      .catch(() => setMeta({}));
  }
  useEffect(load, []);

  async function retrain() {
    setRetraining(true);
    try {
      await adminApi.retrain();
      toast.success("OK");
      load();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t("common.errorOccurred")));
    } finally {
      setRetraining(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.ml")}</h1>
        <Button onClick={retrain} disabled={retraining} className="rounded-full">
          <RefreshCw className={`size-4 mr-1 ${retraining ? "animate-spin" : ""}`} />{" "}
          {t("admin.retrain")}
        </Button>
      </div>
      <GlassCard>
        <h3 className="font-semibold mb-2">{t("admin.modelMeta")}</h3>
        {meta ? (
          <pre className="text-xs whitespace-pre-wrap break-words bg-background/40 rounded-xl p-3 max-h-[60vh] overflow-auto">
            {JSON.stringify(meta, null, 2)}
          </pre>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
        )}
      </GlassCard>
    </div>
  );
}
