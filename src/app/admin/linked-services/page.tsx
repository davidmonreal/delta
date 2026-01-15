import { requireSuperadminSession } from "@/lib/require-auth";
import { PrismaLinkedServiceRepository } from "@/modules/linkedServices/infrastructure/prismaLinkedServiceRepository";
import LinkedServicesConfigurator from "@/components/linked-services/LinkedServicesConfigurator";

export const dynamic = "force-dynamic";

export default async function LinkedServicesPage() {
  await requireSuperadminSession();
  const repo = new PrismaLinkedServiceRepository();
  const [services, links] = await Promise.all([repo.listServices(), repo.listLinks()]);
  await repo.disconnect?.();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Configuracio
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Serveis vinculats
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Defineix quins serveis s&apos;han d&apos;acompanyar en altres mesos.
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <LinkedServicesConfigurator services={services} links={links} />
      </section>
    </div>
  );
}
