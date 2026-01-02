import { formatCurrency } from "@/lib/format";

type ComparisonSummaryRowProps = {
  label: string;
  value: number;
  showPositive: boolean;
};

export default function ComparisonSummaryRow({
  label,
  value,
  showPositive,
}: ComparisonSummaryRowProps) {
  const gridClass = showPositive
    ? "grid-cols-[2fr_repeat(4,minmax(140px,1fr))]"
    : "grid-cols-[2fr_repeat(3,minmax(140px,1fr))]";

  return (
    <div
      className={`mt-3 grid items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 ${gridClass}`}
    >
      <span>{label}</span>
      <span />
      <span className="text-right tabular-nums">{formatCurrency(value)}</span>
      <span />
      {showPositive ? <span /> : null}
    </div>
  );
}
