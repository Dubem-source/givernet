import { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "gold",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: "gold" | "sage" | "coral";
}) {
  const accentClass = {
    gold: "text-gold bg-gold/10",
    sage: "text-sage bg-sage/10",
    coral: "text-coral bg-coral/10",
  }[accent];

  // Dynamically scale down font size as the text gets longer to prevent wrapping or truncation
  const len = value.length;
  const fontSizeClass =
    len <= 6
      ? "text-2xl sm:text-3xl"
      : len <= 9
      ? "text-xl sm:text-2xl"
      : len <= 12
      ? "text-lg sm:text-xl"
      : "text-base sm:text-lg";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs uppercase tracking-wide text-paper/50">{label}</span>
        <span className={`rounded-lg p-1.5 ${accentClass}`}>
          <Icon size={16} strokeWidth={1.75} />
        </span>
      </div>
      <div className={`font-display ${fontSizeClass}`}>{value}</div>
      {sub && <div className="text-xs text-paper/45 mt-1.5">{sub}</div>}
    </div>
  );
}
