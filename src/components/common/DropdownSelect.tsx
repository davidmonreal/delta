import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownSelectOption<T> {
  label: string;
  value: T;
}

interface DropdownSelectProps<T> {
  label?: ReactNode;
  options: DropdownSelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
  buttonClassName?: string;
}

export function DropdownSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  buttonClassName,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  return (
    <div className="flex items-center gap-2">
      {label ? (
        <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
          {label}
        </span>
      ) : null}
      <div
        className="relative"
        tabIndex={0}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex min-w-[170px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 ${buttonClassName ?? ""}`}
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronDown size={16} className="text-slate-500" />
        </button>
        {open ? (
          <div className="absolute right-0 z-20 mt-1 w-full min-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              className={`w-full px-3.5 py-2 text-left text-sm font-medium ${
                !value
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-800 hover:bg-slate-50"
              }`}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              {placeholder}
            </button>
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    className={`w-full px-3.5 py-2 text-left text-sm font-medium ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-800 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
