import { cn } from "@/lib/utils";

export function AppIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className={cn("size-5", className)}>
      <path
        d="M32 10C40.3 15.9 47 24.7 47 35.6C47 45.3 40.3 53 32 53C23.7 53 17 45.3 17 35.6C17 24.7 23.7 15.9 32 10Z"
        fill="currentColor"
        opacity="0.96"
      />
      <path
        d="M32 16V48M32 33C27.9 26.3 24.1 23 18.6 22.4M32 33C36.1 26.3 39.9 23 45.4 22.4M32 45C27 38.1 22.4 35.2 16.3 34.7M32 45C37 38.1 41.6 35.2 47.7 34.7"
        stroke="rgba(15, 118, 110, 0.9)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
