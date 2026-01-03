"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { UploadActionState, UploadBatchResult } from "@/app/admin/upload/actions";
import {
  finalizeUploadAction,
  startUploadAction,
  uploadBatchAction,
} from "@/app/admin/upload/actions";

const initialState: UploadActionState = {};
const BATCH_SIZE = 200;
const MAX_ERRORS = 50;

type UploadProgress = {
  status: "idle" | "processing" | "finalizing";
  step: string;
  processed: number;
  total: number;
};

function ProgressPanel({ progress }: { progress: UploadProgress }) {
  if (progress.status === "idle") return null;

  const percent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{progress.step}</p>
        {progress.total ? (
          <span className="text-xs text-slate-500">
            {progress.processed}/{progress.total} ({percent}%)
          </span>
        ) : null}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Pots revisar duplicats i unmatched mentre la carrega avanca.
      </p>
    </div>
  );
}

export default function UploadDataPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadActionState>(initialState);
  const [progress, setProgress] = useState<UploadProgress>({
    status: "idle",
    step: "",
    processed: 0,
    total: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const resetProgress = () => {
    setProgress({ status: "idle", step: "", processed: 0, total: 0 });
  };

  const serializeRow = (row: Record<string, unknown>) => {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      output[key] = value instanceof Date ? value.toISOString() : value;
    }
    return output;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProcessing) return;

    setState(initialState);
    setIsProcessing(true);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setState({ error: "Selecciona un fitxer per pujar." });
      setIsProcessing(false);
      return;
    }
    if (!file.name || file.size === 0) {
      setState({ error: "El fitxer esta buit." });
      setIsProcessing(false);
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) {
      setState({ error: "El fitxer ha de ser Excel o CSV." });
      setIsProcessing(false);
      return;
    }

    setProgress({
      status: "processing",
      step: "Carregant fitxer",
      processed: 0,
      total: 0,
    });

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setState({ error: "No hem trobat cap full de calcul." });
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
      });
      if (rows.length === 0) {
        setState({ error: "El fitxer no te dades." });
        return;
      }

      setProgress({
        status: "processing",
        step: "Validant columnes",
        processed: 0,
        total: rows.length,
      });

      const { sourceFile } = await startUploadAction(file.name);
      const batches = Math.ceil(rows.length / BATCH_SIZE);

      let summary: UploadActionState["summary"] = {
        fileName: file.name,
        imported: 0,
        assigned: 0,
        unmatched: 0,
        skipped: 0,
        backfilled: 0,
      };
      let rowErrors: UploadActionState["rowErrors"] = [];

      for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
        const batchIndex = Math.floor(offset / BATCH_SIZE);
        const batch = rows
          .slice(offset, offset + BATCH_SIZE)
          .map((row) => serializeRow(row));
        setProgress({
          status: "processing",
          step: `Important dades (${batchIndex + 1}/${batches})`,
          processed: offset,
          total: rows.length,
        });

        const result: UploadBatchResult = await uploadBatchAction({
          rows: batch,
          sourceFile,
          validateHeader: offset === 0,
        });

        if (result.headerErrors) {
          setState({
            error: result.error ?? "La capcalera del fitxer no coincideix.",
            headerErrors: result.headerErrors,
          });
          return;
        }

        if (result.error || !result.summary) {
          setState({ error: result.error ?? "No s'ha pogut processar el fitxer." });
          return;
        }

        summary = {
          ...summary,
          imported: summary.imported + result.summary.imported,
          assigned: summary.assigned + result.summary.assigned,
          unmatched: summary.unmatched + result.summary.unmatched,
          skipped: summary.skipped + result.summary.skipped,
        };

        const adjustedErrors =
          result.rowErrors?.map((error) => ({
            ...error,
            row: error.row + offset,
          })) ?? [];
        rowErrors = [...(rowErrors ?? []), ...adjustedErrors].slice(0, MAX_ERRORS);

        setProgress({
          status: "processing",
          step: `Important dades (${batchIndex + 1}/${batches})`,
          processed: Math.min(rows.length, offset + batch.length),
          total: rows.length,
        });

        router.refresh();
      }

      setProgress({
        status: "finalizing",
        step: "Assignant gestors",
        processed: rows.length,
        total: rows.length,
      });

      const { backfilled } = await finalizeUploadAction();
      summary = { ...summary, backfilled };

      setState({
        summary,
        rowErrors,
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setState({ error: "No s'ha pogut processar el fitxer." });
    } finally {
      setIsProcessing(false);
      resetProgress();
    }
  };

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
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".xlsx,.csv"
            required
            disabled={isProcessing}
            ref={fileInputRef}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
          />
          <button
            type="submit"
            disabled={isProcessing}
            className="rounded-full bg-emerald-700 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {isProcessing ? "Processant..." : "Carregar dades"}
          </button>
        </div>
        <ProgressPanel progress={progress} />
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
