export function Logo({ className }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight text-xl ${className ?? ""}`}>
      <span className="text-[#111827]">aura</span>
      <span className="text-[#D946EF]">pass</span>
    </span>
  );
}
