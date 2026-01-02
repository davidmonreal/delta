"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SearchInputProps = {
  name: string;
  placeholder?: string;
  defaultValue?: string;
  minChars?: number;
};

export default function SearchInput({
  name,
  placeholder = "Search...",
  defaultValue,
  minChars = 3,
}: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");
  const trimmed = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (trimmed.length >= minChars) {
        const params = new URLSearchParams();
        params.set(name, trimmed);
        router.replace(`?${params.toString()}`);
        router.refresh();
      } else if (trimmed.length === 0) {
        router.replace("?");
        router.refresh();
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [name, router, trimmed, minChars]);

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
