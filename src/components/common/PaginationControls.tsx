"use client";

type PaginationControlsProps = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function PaginationControls({
  page,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const end = Math.min(clampedPage * pageSize, totalItems);
  const isFirst = clampedPage <= 1;
  const isLast = clampedPage >= totalPages;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 ${
        className ?? ""
      }`}
    >
      <span>
        {totalItems === 0
          ? "No hi ha elements."
          : `Mostrant ${start}-${end} de ${totalItems}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(clampedPage - 1)}
          disabled={isFirst}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Anterior
        </button>
        <span className="text-xs text-slate-400">
          {clampedPage}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(clampedPage + 1)}
          disabled={isLast}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Seguent
        </button>
      </div>
    </div>
  );
}
