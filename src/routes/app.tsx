import { createFileRoute } from "@tanstack/react-router";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  component: () => (
    <AuthGate>
      <AppShell />
    </AuthGate>
  ),
});
