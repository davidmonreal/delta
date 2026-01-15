"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { UnmatchedInvoiceLine } from "@/modules/invoices/ports/invoiceRepository";
import { formatCurrency } from "@/lib/format";
import ManagerAssignForm from "@/components/admin/ManagerAssignForm";
import PaginationControls from "@/components/common/PaginationControls";

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
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [selectedUsersByLine, setSelectedUsersByLine] = useState<
    Record<number, number | null>
  >(() =>
    Object.fromEntries(lines.map((line) => [line.id, line.suggestedUserId ?? null])),
  );

  useEffect(() => {
    setSelectedUsersByLine(
      Object.fromEntries(lines.map((line) => [line.id, line.suggestedUserId ?? null])),
    );
  }, [lines]);

  const handleUserChange = useCallback((lineId: number, userId: number | null) => {
    setSelectedUsersByLine((prev) => ({ ...prev, [lineId]: userId }));
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(sortedLines.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLines = sortedLines.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectionCounts = useMemo(() => {
    const counts = new Map<number, Map<number, number>>();
    for (const line of lines) {
      const selectedUserId = selectedUsersByLine[line.id];
      if (!selectedUserId) continue;
      const byUser = counts.get(line.clientId) ?? new Map<number, number>();
      byUser.set(selectedUserId, (byUser.get(selectedUserId) ?? 0) + 1);
      counts.set(line.clientId, byUser);
    }
    return counts;
  }, [lines, selectedUsersByLine]);

  useEffect(() => {
    setPage(1);
  }, [lines, direction]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
      {pagedLines.map((line) => {
        const selectedUserId = selectedUsersByLine[line.id] ?? null;
        const sameClientSelectedCount = selectedUserId
          ? selectionCounts.get(line.clientId)?.get(selectedUserId) ?? 0
          : 0;
        return (
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
              clientId={line.clientId}
              clientName={line.clientName}
              users={users}
              selectedUserId={selectedUserId}
              onSelectedUserIdChange={(userId) => handleUserChange(line.id, userId)}
              sameClientSelectedCount={sameClientSelectedCount}
              action={action}
            />
          </div>
        </div>
        );
      })}
      <PaginationControls
        page={currentPage}
        totalItems={sortedLines.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
