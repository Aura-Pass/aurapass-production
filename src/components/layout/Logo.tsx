export function Logo({ className }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight text-xl ${className ?? ""}`}>
      <span className="text-foreground">aura</span>
      <span className="text-primary">pass</span>
    </span>
  );
}
