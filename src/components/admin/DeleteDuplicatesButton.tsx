"use client";

import { useFormStatus } from "react-dom";

export default function DeleteDuplicatesButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!confirm("Segur que vols esborrar els duplicats?")) {
          event.preventDefault();
        }
      }}
      className="rounded-full border border-red-200 px-5 py-2 text-xs font-semibold text-red-600 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
    >
      {pending ? "Esborrant..." : "Esborrar duplicats"}
    </button>
  );
}
