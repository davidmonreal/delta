import { requireAdminSession } from "@/lib/require-auth";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { assignManagerAction } from "./actions";
import UnmatchedInvoiceTable from "@/components/admin/UnmatchedInvoiceTable";
import UploadDataPanel from "@/components/admin/UploadDataPanel";
import { getUnmatchedAssignments } from "@/modules/invoices/application/getUnmatchedAssignments";
import SuggestManagersButton from "@/components/admin/SuggestManagersButton";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  searchParams,
}: {
  searchParams?: Promise<{ suggest?: string }>;
}) {
  await requireAdminSession();
  const invoiceRepo = new PrismaInvoiceRepository();
  const userRepo = new PrismaUserRepository();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const suggestionsEnabled = resolvedSearchParams?.suggest === "1";
  const { lines: unmatchedLines, users } = await getUnmatchedAssignments({
    invoiceRepo,
    userRepo,
    suggestionsEnabled,
  });
  const userOptions = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Administració
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
              {unmatchedLines.length} línies pendents de casar.
            </p>
          </div>
          <SuggestManagersButton
            href="/admin/upload?suggest=1"
            disabled={unmatchedLines.length === 0}
            suggestionsEnabled={suggestionsEnabled}
          />
        </div>
        <UnmatchedInvoiceTable
          lines={unmatchedLines}
          users={userOptions}
          action={assignManagerAction}
        />
      </section>
    </div>
  );
}
