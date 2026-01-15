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
  const [state, setState] = useState<ActionState>(initialState);
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

  const selectedLinks = useMemo(() => {
    if (!selectedServiceId) return [];
    return links
      .filter(
        (link) =>
          link.serviceId === selectedServiceId ||
          link.linkedServiceId === selectedServiceId,
      )
      .map((link) => {
        const otherServiceId =
          link.serviceId === selectedServiceId
            ? link.linkedServiceId
            : link.serviceId;
        return {
          id: link.id,
          offsetMonths: link.offsetMonths,
          otherServiceId,
          otherLabel: serviceMap.get(otherServiceId) ?? "Servei desconegut",
        };
      })
      .sort((a, b) => {
        if (a.offsetMonths !== b.offsetMonths) return a.offsetMonths - b.offsetMonths;
        return a.otherLabel.localeCompare(b.otherLabel, "ca");
      });
  }, [links, selectedServiceId, serviceMap]);

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
      setState(result);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,1.2fr)_minmax(280px,1fr)]">
        <SearchableDropdownSelect
          label="Servei base"
          options={serviceOptions}
          value={selectedServiceId}
          onChange={setSelectedServiceId}
          placeholder="Selecciona un servei"
          searchPlaceholder="Cerca serveis..."
        />
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <SearchableDropdownSelect
            label="Servei vinculat"
            options={serviceOptions}
            value={linkedServiceId}
            onChange={setLinkedServiceId}
            placeholder="Selecciona servei vinculat"
            searchPlaceholder="Cerca serveis..."
          />
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
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            Afegir vinculació
          </button>
          {state.error ? (
            <p className="text-sm font-semibold text-red-600">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm font-semibold text-emerald-700">{state.success}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
          <span>Vinculacions</span>
          <span className="text-xs text-slate-400">
            {selectedLinks.length} registres
          </span>
        </div>
        {selectedServiceId ? (
          selectedLinks.length ? (
            <div className="divide-y divide-slate-100">
              {selectedLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">
                      {link.otherLabel}
                    </span>
                    <span className="text-xs text-slate-400">
                      {link.offsetMonths === 0
                        ? "Mateix mes"
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
            <p className="px-4 py-6 text-sm text-slate-500">
              No hi ha vinculacions per aquest servei.
            </p>
          )
        ) : (
          <p className="px-4 py-6 text-sm text-slate-500">
            Selecciona un servei per veure les vinculacions.
          </p>
        )}
      </div>
    </div>
  );
}
