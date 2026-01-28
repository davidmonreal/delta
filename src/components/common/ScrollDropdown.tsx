"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DropdownOption = {
  value: string;
  label: string;
};

type ScrollDropdownProps = {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function ScrollDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecciona",
  disabled = false,
  className,
}: ScrollDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label ?? placeholder,
    [options, placeholder, value],
  );

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative flex flex-col gap-2 ${className ?? ""}`.trim()}
    >
      {label ? (
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-base font-semibold transition ${
          disabled
            ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"
            : "border-slate-200 bg-white text-slate-900 hover:border-emerald-300"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="ml-2 text-slate-400">▾</span>
      </button>
      {open && !disabled ? (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          style={{ maxHeight: "calc(10 * 36px + 8px)" }}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">
              Sense opcions
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex h-9 w-full items-center px-3 text-left text-sm transition ${
                  option.value === value
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
