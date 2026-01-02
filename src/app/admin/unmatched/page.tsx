import { requireAdminSession } from "@/lib/require-auth";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { listUnmatched } from "@/modules/invoices/application/listUnmatched";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { assignManagerAction } from "./actions";
import ManagerAssignForm from "@/components/admin/ManagerAssignForm";

export const dynamic = "force-dynamic";

export default async function UnmatchedManagersPage() {
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Administracio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Factures sense responsable
        </h1>
        <p className="mt-2 text-base text-slate-500">
          {unmatched.length} linies pendents de casar.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/users"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Tornar a usuaris
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_auto] items-center gap-4 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Gestor</span>
            <span>Client</span>
            <span>Servei</span>
            <span className="text-right">Total</span>
            <span className="text-right">Assignar</span>
          </div>
          {unmatched.map((line) => (
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
