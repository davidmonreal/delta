"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import type { UploadActionState } from "@/app/admin/upload/actions";
import { uploadDataAction } from "@/app/admin/upload/actions";

const initialState: UploadActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
    >
      {pending ? "Processant..." : "Carregar dades"}
    </button>
  );
}

function ProcessingMessage() {
  const { pending } = useFormStatus();
  const steps = [
    {
      label: "Carregant fitxer",
      detail: "Llegint el contingut i convertint-lo a files.",
    },
    {
      label: "Validant columnes",
      detail: "Comprovant que la capcalera coincideix amb els uploads anteriors.",
    },
    {
      label: "Important dades",
      detail: "Desant les linies i preparant els resultats.",
    },
    {
      label: "Assignant gestors",
      detail: "Buscant coincidencies automatiques per cada linia.",
    },
    {
      label: "Buscant duplicats",
      detail: "Comprovant series i albarans repetits.",
    },
  ];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!pending) {
      setStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % steps.length);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [pending, steps.length]);

  if (!pending) return null;

  const step = steps[stepIndex] ?? steps[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-semibold">Processant el fitxer...</p>
      <p className="mt-1">
        Pas {stepIndex + 1}/{steps.length}:{" "}
        <span className="font-semibold">{step.label}</span>
      </p>
      <p className="mt-1 text-xs text-slate-500">{step.detail}</p>
    </div>
  );
}

export default function UploadDataPanel() {
  const router = useRouter();
  const [state, formAction] = useActionState(uploadDataAction, initialState);

  useEffect(() => {
    if (state.summary) {
      router.refresh();
    }
  }, [state.summary, router]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pujar fitxer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Accepta Excel (.xlsx) o CSV amb les mateixes columnes.
          </p>
        </div>
      </div>
      <form className="mt-4 flex flex-col gap-4" action={formAction}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".xlsx,.csv"
            required
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
          />
          <SubmitButton />
        </div>
        <ProcessingMessage />
        {state.error ? (
          <p className="text-sm font-semibold text-red-600">{state.error}</p>
        ) : null}
        {state.headerErrors ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <p className="font-semibold">Capcalera incorrecta.</p>
            {state.headerErrors.missing.length ? (
              <p>Falten columnes: {state.headerErrors.missing.join(", ")}.</p>
            ) : null}
            {state.headerErrors.extra.length ? (
              <p>Columnes inesperades: {state.headerErrors.extra.join(", ")}.</p>
            ) : null}
          </div>
        ) : null}
        {state.summary ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Carrega finalitzada.</p>
            <p className="mt-1">
              Fitxer: <span className="font-semibold">{state.summary.fileName}</span>
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Linies importades:{" "}
                <span className="font-semibold">{state.summary.imported}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Assignades automaticament:{" "}
                <span className="font-semibold">{state.summary.assigned}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Sense responsable:{" "}
                <span className="font-semibold">{state.summary.unmatched}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Linies amb error:{" "}
                <span className="font-semibold">{state.summary.skipped}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Assignacions extra:{" "}
                <span className="font-semibold">{state.summary.backfilled}</span>
              </div>
            </div>
          </div>
        ) : null}
        {state.rowErrors?.length ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold">Errors detectats:</p>
            <ul className="mt-2 space-y-1">
              {state.rowErrors.map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Linia {error.row}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </section>
  );
}
