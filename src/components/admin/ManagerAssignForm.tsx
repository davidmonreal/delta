"use client";

import { useCallback, useMemo, useRef } from "react";

import { SearchableDropdownSelect } from "@/components/common/SearchableDropdownSelect";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type ManagerAssignFormProps = {
  lineId: number;
  clientId: number;
  clientName: string;
  users: UserOption[];
  selectedUserId: number | null;
  onSelectedUserIdChange: (userId: number | null) => void;
  sameClientSelectedCount: number;
  action: (formData: FormData) => Promise<void>;
};

function buildLabel(user: UserOption) {
  return user.name ?? user.email;
}

export default function ManagerAssignForm({
  lineId,
  clientId,
  clientName,
  users,
  selectedUserId,
  onSelectedUserIdChange,
  sameClientSelectedCount,
  action,
}: ManagerAssignFormProps) {
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const options = useMemo(
    () =>
      [...users]
        .sort((a, b) =>
          buildLabel(a).localeCompare(buildLabel(b), "ca", {
            sensitivity: "base",
          }),
        )
        .map((user) => ({
          label: buildLabel(user),
          value: user.id,
        })),
    [users],
  );
  const userLabels = useMemo(
    () => new Map(users.map((user) => [user.id, buildLabel(user)])),
    [users],
  );
  const selectedUserLabel =
    selectedUserId != null ? userLabels.get(selectedUserId) ?? "" : "";

  const handleSubmit = useCallback(
    () => {
      if (!bulkInputRef.current) return;
      if (!selectedUserId || sameClientSelectedCount <= 1) {
        bulkInputRef.current.value = "0";
        return;
      }

      const label = selectedUserLabel || "aquest usuari";
      const wantsBulk = window.confirm(
        `Vols assignar ${label} a totes les línies de ${clientName}?`,
      );
      bulkInputRef.current.value = wantsBulk ? "1" : "0";
    },
    [clientName, sameClientSelectedCount, selectedUserId, selectedUserLabel],
  );

  return (
    <form action={action} className="flex items-center gap-2" onSubmit={handleSubmit}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="userId" value={selectedUserId ?? ""} />
      <input type="hidden" name="clientId" value={clientId} />
      <input ref={bulkInputRef} type="hidden" name="bulk" value="0" />
      <div className="min-w-[220px]">
        <SearchableDropdownSelect
          options={options}
          value={selectedUserId}
          onChange={onSelectedUserIdChange}
          placeholder="Selecciona usuari"
          searchPlaceholder="Cerca usuari..."
          buttonClassName="h-10 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={!selectedUserId}
        className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        Assignar
      </button>
    </form>
  );
}
