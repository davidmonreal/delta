import { requireAdminSession } from "@/lib/require-auth";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { listUnmatched } from "@/modules/invoices/application/listUnmatched";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { assignManagerAction } from "./actions";
import ManagerAssignForm from "@/components/admin/ManagerAssignForm";
import UploadDataPanel from "@/components/admin/UploadDataPanel";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  searchParams,
}: {
  searchParams?: { suggest?: string };
}) {
  await requireAdminSession();
  const invoiceRepo = new PrismaInvoiceRepository();
  const userRepo = new PrismaUserRepository();

  const [unmatched, users] = await Promise.all([
    listUnmatched({ repo: invoiceRepo }),
    userRepo.listAll(),
  ]);
  const userOptions = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));

  const suggestionsEnabled = searchParams?.suggest === "1";
  const unmatchedLines = suggestionsEnabled
    ? unmatched
    : unmatched.map((line) => ({ ...line, suggestedUserId: null }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Administracio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Upload</h1>
        <p className="mt-2 text-base text-slate-500">
          Carrega fitxers nous i revisa duplicats o factures sense responsable.
        </p>
      </header>

      <UploadDataPanel />

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Factures sense responsable
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {unmatchedLines.length} linies pendents de casar.
            </p>
          </div>
          <Link
            href="/admin/upload?suggest=1"
            aria-disabled={suggestionsEnabled || unmatchedLines.length === 0}
            className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
              suggestionsEnabled || unmatchedLines.length === 0
                ? "pointer-events-none bg-slate-200 text-slate-500"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {suggestionsEnabled ? "Suggeriments actius" : "Suggerir gestors"}
          </Link>
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_auto] items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Gestor</span>
            <span>Client</span>
            <span>Servei</span>
            <span className="text-right">Total</span>
            <span className="text-right">Assignar</span>
          </div>
          {unmatchedLines.map((line) => (
            <div
              key={line.id}
              className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_auto] items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
            >
              <div>
                <span className="block font-medium">{line.manager}</span>
              </div>
              <span>{line.clientName}</span>
              <span>{line.serviceName}</span>
              <span className="text-right tabular-nums">
                {formatCurrency(line.total)}
              </span>
              <ManagerAssignForm
                lineId={line.id}
                users={userOptions}
                suggestedUserId={line.suggestedUserId}
                action={assignManagerAction}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
