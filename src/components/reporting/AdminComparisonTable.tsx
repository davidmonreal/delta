"use client";

import { useMemo, useState } from "react";

import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";
import ComparisonTable from "@/components/reporting/ComparisonTable";
import { DropdownSelect } from "@/components/common/DropdownSelect";

type UserOption = {
  id: number;
  label: string;
};

type AdminComparisonTableProps = {
  rows: ComparisonRowViewModel[];
  users?: UserOption[];
  periodALabel: string;
  periodBLabel: string;
  showPositive: boolean;
  showEqual: boolean;
  showMissing: boolean;
  showNew: boolean;
  firstColumnLabel: string;
  currentFirst?: boolean;
  onCommentCreated?: (
    clientId: number,
    serviceId: number,
    year: number,
    month: number,
  ) => void;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ca");
}

export default function AdminComparisonTable({
  rows,
  users,
  periodALabel,
  periodBLabel,
  showPositive,
  showEqual,
  showMissing,
  showNew,
  firstColumnLabel,
  currentFirst = false,
  onCommentCreated,
}: AdminComparisonTableProps) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const dropdownOptions = useMemo(
    () => [
      { value: "all", label: "Tots els usuaris" },
      ...(users ?? []).map((user) => ({
        value: String(user.id),
        label: user.label,
      })),
    ],
    [users],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    const selectedUser =
      selectedUserId && selectedUserId !== "all"
        ? users?.find((user) => String(user.id) === selectedUserId) ?? null
        : null;
    const selectedLabel = selectedUser?.label
      ? normalizeSearch(selectedUser.label)
      : null;
    return rows.filter((row) => {
      if (normalizedQuery) {
        const normalizedTitle = normalizeSearch(row.title);
        if (!normalizedTitle.includes(normalizedQuery)) {
          return false;
        }
      }
      if (selectedUserId && selectedUserId !== "all") {
        const userId = Number.parseInt(selectedUserId, 10);
        if (!Number.isNaN(userId) && row.managerUserId === userId) {
          return true;
        }
        if (selectedLabel) {
          const managerLabel = row.managerName
            ? normalizeSearch(row.managerName)
            : row.subtitle
              ? normalizeSearch(row.subtitle)
              : "";
          if (managerLabel.includes(selectedLabel)) {
            return true;
          }
        }
        return false;
      }
      return true;
    });
  }, [rows, query, selectedUserId, users]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Client
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per client"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="min-w-[220px] flex-1">
          <DropdownSelect
            label="Usuari"
            options={dropdownOptions}
            value={selectedUserId}
            onChange={setSelectedUserId}
            placeholder="Tots els usuaris"
            buttonClassName="text-left"
          />
        </div>
      </div>
      <ComparisonTable
        rows={filteredRows}
        periodALabel={periodALabel}
        periodBLabel={periodBLabel}
        showPositive={showPositive}
        showEqual={showEqual}
        showMissing={showMissing}
        showNew={showNew}
        firstColumnLabel={firstColumnLabel}
        currentFirst={currentFirst}
        onCommentCreated={onCommentCreated}
      />
    </div>
  );
}
