"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");
  const lastAppliedRef = useRef<string | null>(null);
  const trimmed = useMemo(() => value.trim(), [value]);
  const currentValue = useMemo(
    () => searchParams.get(name)?.trim() ?? "",
    [name, searchParams],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (trimmed.length >= minChars) {
        if (trimmed === currentValue) return;
        if (lastAppliedRef.current === trimmed) return;
        lastAppliedRef.current = trimmed;
        const params = new URLSearchParams(searchParams.toString());
        params.set(name, trimmed);
        router.replace(`?${params.toString()}`);
      } else if (trimmed.length === 0) {
        if (!currentValue) return;
        if (lastAppliedRef.current === "") return;
        lastAppliedRef.current = "";
        const params = new URLSearchParams(searchParams.toString());
        params.delete(name);
        const query = params.toString();
        router.replace(query ? `?${query}` : "?");
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [currentValue, minChars, name, router, searchParams, trimmed]);

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
