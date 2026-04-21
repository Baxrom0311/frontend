import { cn } from "@/lib/utils";

export function GlassCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-3xl p-5 transition-all", className)} {...props}>
      {children}
    </div>
  );
}
