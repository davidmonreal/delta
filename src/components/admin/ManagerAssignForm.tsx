"use client";

import { useMemo, useState } from "react";

import { SearchableDropdownSelect } from "@/components/common/SearchableDropdownSelect";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type ManagerAssignFormProps = {
  lineId: number;
  users: UserOption[];
  action: (formData: FormData) => Promise<void>;
};

function buildLabel(user: UserOption) {
  return user.name ?? user.email;
}

export default function ManagerAssignForm({
  lineId,
  users,
  action,
}: ManagerAssignFormProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="userId" value={selectedUserId ?? ""} />
      <div className="min-w-[220px]">
        <SearchableDropdownSelect
          options={options}
          value={selectedUserId}
          onChange={setSelectedUserId}
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
