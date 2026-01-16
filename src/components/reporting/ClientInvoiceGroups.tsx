"use client";

import { useEffect, useState } from "react";

import { formatCurrency, formatUnits } from "@/lib/format";
import PaginationControls from "@/components/common/PaginationControls";
import type { ClientInvoiceLineGroup } from "@/modules/reporting/application/getClientInvoiceLines";

type ClientInvoiceGroupsProps = {
  groups: ClientInvoiceLineGroup[];
  monthLabels: string[];
};

export default function ClientInvoiceGroups({
  groups,
  monthLabels,
}: ClientInvoiceGroupsProps) {
  const pageSize = 20;
  const [groupPage, setGroupPage] = useState(1);
  const [linePages, setLinePages] = useState<Record<string, number>>({});
  const totalGroupPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const currentGroupPage = Math.min(groupPage, totalGroupPages);
  const pagedGroups = groups.slice(
    (currentGroupPage - 1) * pageSize,
    currentGroupPage * pageSize,
  );

  useEffect(() => {
    setGroupPage(1);
    setLinePages({});
  }, [groups]);

  const setLinePage = (key: string, page: number) => {
    setLinePages((prev) => ({ ...prev, [key]: page }));
  };

  return (
    <div className="grid gap-6">
      {pagedGroups.map((group) => {
        const groupKey = `${group.year}-${group.month}`;
        const linePage = linePages[groupKey] ?? 1;
        const totalLinePages = Math.max(
          1,
          Math.ceil(group.lines.length / pageSize),
        );
        const currentLinePage = Math.min(linePage, totalLinePages);
        const pagedLines = group.lines.slice(
          (currentLinePage - 1) * pageSize,
          currentLinePage * pageSize,
        );

        return (
          <div key={groupKey} className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {monthLabels[group.month - 1] ?? group.month}/{group.year}
            </div>
            <div className="grid gap-2">
              {pagedLines.map((line) => (
                <div
                  key={line.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm text-slate-800 ${
                    line.isLinkedService
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {line.serviceName}
                    </p>
                    {line.managerName ? (
                      <p className="text-xs text-slate-500">
                        {line.managerName}
                      </p>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      {[line.series, line.albaran, line.numero]
                        .filter(Boolean)
                        .join("-")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(line.total)}</p>
                    <p className="text-xs text-slate-500">
                      {formatUnits(line.units)} unitats
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls
              page={currentLinePage}
              totalItems={group.lines.length}
              pageSize={pageSize}
              onPageChange={(next) => setLinePage(groupKey, next)}
            />
          </div>
        );
      })}
      <PaginationControls
        page={currentGroupPage}
        totalItems={groups.length}
        pageSize={pageSize}
        onPageChange={setGroupPage}
      />
    </div>
  );
}
