"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SearchableDropdownSelect } from "@/components/common/SearchableDropdownSelect";
import { createServiceLinkAction, deleteServiceLinkAction } from "@/app/admin/linked-services/actions";

type ServiceOption = {
  id: number;
  label: string;
};

type LinkedServiceLink = {
  id: number;
  serviceId: number;
  linkedServiceId: number;
  offsetMonths: number;
};

type ActionState = {
  error?: string;
  success?: string;
};

type LinkedServicesConfiguratorProps = {
  services: ServiceOption[];
  links: LinkedServiceLink[];
};

const initialState: ActionState = {};

export default function LinkedServicesConfigurator({
  services,
  links,
}: LinkedServicesConfiguratorProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    services[0]?.id ?? null,
  );
  const [linkedServiceId, setLinkedServiceId] = useState<number | null>(null);
  const [offsetMonths, setOffsetMonths] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [state, setState] = useState<ActionState>(initialState);
  const [listState, setListState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const serviceMap = useMemo(
    () => new Map(services.map((service) => [service.id, service.label])),
    [services],
  );

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        value: service.id,
        label: service.label,
      })),
    [services],
  );

  const filteredLinks = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("ca");
    return links
      .map((link) => ({
        id: link.id,
        offsetMonths: link.offsetMonths,
        serviceId: link.serviceId,
        linkedServiceId: link.linkedServiceId,
        serviceLabel: serviceMap.get(link.serviceId) ?? "Servei desconegut",
        linkedLabel: serviceMap.get(link.linkedServiceId) ?? "Servei desconegut",
      }))
      .filter((link) => {
        if (!normalizedQuery) return true;
        const haystack = `${link.serviceLabel} ${link.linkedLabel}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("ca");
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (a.serviceLabel !== b.serviceLabel) {
          return a.serviceLabel.localeCompare(b.serviceLabel, "ca");
        }
        if (a.linkedLabel !== b.linkedLabel) {
          return a.linkedLabel.localeCompare(b.linkedLabel, "ca");
        }
        return a.offsetMonths - b.offsetMonths;
      });
  }, [links, searchQuery, serviceMap]);

  function handleCreate() {
    if (!selectedServiceId || !linkedServiceId) {
      setState({ error: "Selecciona els dos serveis." });
      return;
    }

    const formData = new FormData();
    formData.set("serviceId", String(selectedServiceId));
    formData.set("linkedServiceId", String(linkedServiceId));
    formData.set("offsetMonths", String(offsetMonths));

    startTransition(async () => {
      const result = await createServiceLinkAction(initialState, formData);
      setState(result);
      setListState(initialState);
      if (result.success) {
        setLinkedServiceId(null);
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    const formData = new FormData();
    formData.set("id", String(id));
    startTransition(async () => {
      const result = await deleteServiceLinkAction(initialState, formData);
      setListState(result);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <SearchableDropdownSelect
            label="Servei base"
            options={serviceOptions}
            value={selectedServiceId}
            onChange={setSelectedServiceId}
            placeholder="Selecciona un servei"
            searchPlaceholder="Cerca serveis..."
          />
          <SearchableDropdownSelect
            label="Servei vinculat"
            options={serviceOptions}
            value={linkedServiceId}
            onChange={setLinkedServiceId}
            placeholder="Selecciona servei vinculat"
            searchPlaceholder="Cerca serveis..."
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr] lg:items-end">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            Mesos de diferència
            <input
              type="number"
              min={0}
              max={24}
              value={offsetMonths}
              onChange={(event) => setOffsetMonths(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              Afegir vinculació
            </button>
            {state.error ? (
              <p className="text-sm font-semibold text-red-600">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm font-semibold text-emerald-700">
                {state.success}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Vinculacions</h2>
            <p className="text-xs text-slate-400">
              {filteredLinks.length} registres
            </p>
            {listState.error ? (
              <p className="mt-2 text-sm font-semibold text-red-600">
                {listState.error}
              </p>
            ) : null}
            {listState.success ? (
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                {listState.success}
              </p>
            ) : null}
          </div>
          <label className="flex w-full max-w-sm flex-col gap-3 pb-10 text-xs font-semibold text-slate-500">
            Cercador
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cerca serveis vinculats..."
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
        <div className="border-b border-slate-100 mt-4" />
        {filteredLinks.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {filteredLinks.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-slate-700"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">
                    {link.serviceLabel}
                  </span>
                  <span className="text-xs text-slate-400">
                    ↔ {link.linkedLabel} ·{" "}
                    {link.offsetMonths === 0
                      ? "mateix mes"
                      : `${link.offsetMonths} mesos`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(link.id)}
                  disabled={isPending}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Esborrar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-500">No hi ha vinculacions.</p>
        )}
      </div>
    </div>
  );
}
