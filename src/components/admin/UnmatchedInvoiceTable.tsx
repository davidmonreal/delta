"use client";

import { useMemo, useState } from "react";

import type { UnmatchedInvoiceLine } from "@/modules/invoices/ports/invoiceRepository";
import { formatCurrency } from "@/lib/format";
import ManagerAssignForm from "@/components/admin/ManagerAssignForm";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type SortDirection = "asc" | "desc";

type UnmatchedInvoiceTableProps = {
  lines: UnmatchedInvoiceLine[];
  users: UserOption[];
  action: (formData: FormData) => Promise<void>;
};

const gridClass = "grid-cols-[1.6fr_1.6fr_1.6fr_0.7fr_320px]";

export default function UnmatchedInvoiceTable({
  lines,
  users,
  action,
}: UnmatchedInvoiceTableProps) {
  const [direction, setDirection] = useState<SortDirection>("asc");

  const sortedLines = useMemo(() => {
    const withIndex = lines.map((line, index) => ({ line, index }));
    const factor = direction === "asc" ? 1 : -1;
    return withIndex
      .sort((a, b) => {
        const value = a.line.clientName.localeCompare(b.line.clientName, "ca");
        if (value !== 0) return value * factor;
        return a.index - b.index;
      })
      .map(({ line }) => line);
  }, [lines, direction]);

  const arrow = direction === "asc" ? "↑" : "↓";

  return (
    <div className="grid gap-3">
      <div
        className={`grid ${gridClass} items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400`}
      >
        <span>Gestor</span>
        <button
          type="button"
          onClick={() => setDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
          className="flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-500"
        >
          <span>Client</span>
          <span className="text-[10px] tracking-normal">{arrow}</span>
        </button>
        <span>Servei</span>
        <span className="text-right">Total</span>
        <span className="text-right">Assignar</span>
      </div>
      {sortedLines.map((line) => (
        <div
          key={line.id}
          className={`grid ${gridClass} items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800`}
        >
          <div>
            <span className="block font-medium">{line.manager}</span>
          </div>
          <span>{line.clientName}</span>
          <span>{line.serviceName}</span>
          <span className="text-right tabular-nums">
            {formatCurrency(line.total)}
          </span>
          <div className="w-[320px]">
            <ManagerAssignForm
              lineId={line.id}
              users={users}
              suggestedUserId={line.suggestedUserId}
              action={action}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
