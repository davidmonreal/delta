"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";

interface DropdownSelectOption<T> {
  label: string;
  value: T;
}

interface SearchableDropdownSelectProps<T> {
  label?: ReactNode;
  options: DropdownSelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  buttonClassName?: string;
}

export function SearchableDropdownSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecciona una opcio",
  searchPlaceholder = "Cerca...",
  buttonClassName,
}: SearchableDropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, query]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [value]);

  return (
    <div className="flex w-full flex-col gap-2" ref={rootRef}>
      {label ? (
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      ) : null}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${buttonClassName ?? ""}`}
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronDown size={18} className="text-slate-400" />
        </button>
        {open ? (
          <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1">
                <Search size={16} className="text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-slate-800 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length ? (
                filtered.map((opt) => {
                  const isActive = opt.value === value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      className={`w-full px-4 py-2 text-left text-sm font-medium ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-800 hover:bg-slate-50"
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-slate-400">
                  No hi ha coincidencies
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
