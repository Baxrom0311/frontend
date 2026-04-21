export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden aurora-bg">
      <div
        className="absolute -top-40 -left-32 size-[36rem] rounded-full opacity-60 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 60%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 size-[40rem] rounded-full opacity-50 blur-3xl animate-blob"
        style={{
          background: "radial-gradient(circle, var(--secondary), transparent 60%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/4 size-[34rem] rounded-full opacity-40 blur-3xl animate-blob"
        style={{
          background: "radial-gradient(circle, var(--success), transparent 60%)",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
}
