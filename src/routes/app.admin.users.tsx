import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthGate } from "@/components/AuthGate";
import { GlassCard } from "@/components/GlassCard";
import { adminApi, type User } from "@/lib/api";

export const Route = createFileRoute("/app/admin/users")({
  component: () => (
    <AuthGate roles={["admin"]}>
      <UsersPage />
    </AuthGate>
  ),
});

function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    adminApi
      .users()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.users")}</h1>
      {users === null ? (
        <GlassCard>
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.loading")}</p>
        </GlassCard>
      ) : users.length === 0 ? (
        <GlassCard>
          <p className="text-center text-sm text-muted-foreground py-8">{t("common.empty")}</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground text-left">
                <th className="py-2 pr-4">{t("auth.fullName")}</th>
                <th className="py-2 pr-4">{t("auth.email")}</th>
                <th className="py-2 pr-4">{t("auth.role")}</th>
                <th className="py-2 pr-4">{t("auth.preferredLanguage")}</th>
                <th className="py-2 pr-4">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 pr-4 font-medium">{u.full_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize">
                      {t(`roles.${u.role}`)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 uppercase text-xs">{u.preferred_language}</td>
                  <td className="py-3 pr-4">
                    {u.is_active ? (
                      <span className="text-success-foreground">●</span>
                    ) : (
                      <span className="text-muted-foreground">○</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
