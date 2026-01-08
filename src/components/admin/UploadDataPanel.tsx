"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";

const initialState: UploadActionState = {};
const POLL_INTERVAL_MS = 3000;

type UploadProgress = {
  status: "idle" | "uploading" | "processing" | "finalizing";
  step: string;
  processed: number;
  total: number;
};

type UploadJobSummary = {
  fileName: string;
  imported: number;
  assigned: number;
  unmatched: number;
  skipped: number;
  backfilled: number;
  rowErrors?: UploadActionState["rowErrors"];
  headerErrors?: UploadActionState["headerErrors"];
};

type UploadJobStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "finalizing"
  | "done"
  | "error";

type UploadJob = {
  id: string;
  fileName: string;
  status: UploadJobStatus;
  progress: number;
  processedRows: number;
  totalRows: number;
  summary?: UploadJobSummary | null;
  errorMessage?: string | null;
};

type UploadActionState = {
  error?: string;
  headerErrors?: { missing: string[]; extra: string[] };
  rowErrors?: { row: number; message: string }[];
  summary?: {
    fileName: string;
    imported: number;
    assigned: number;
    unmatched: number;
    skipped: number;
    backfilled: number;
  };
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
        {progress.status !== "uploading" && progress.total ? (
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
        {progress.status === "uploading"
          ? "Pugem el fitxer abans de processar-lo."
          : "Recalculem les assignacions pendents mentre la carrega avanca."}
      </p>
    </div>
  );
}

export default function UploadDataPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadActionState>(initialState);
  const [progress, setProgress] = useState<UploadProgress>({
    status: "idle",
    step: "",
    processed: 0,
    total: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [job, setJob] = useState<UploadJob | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const resetProgress = () => {
    setProgress({ status: "idle", step: "", processed: 0, total: 0 });
  };

  const updateFromJob = (nextJob: UploadJob) => {
    setJob(nextJob);
    setIsProcessing(
      ["pending", "uploading", "processing", "finalizing"].includes(nextJob.status),
    );
    if (nextJob.status === "processing") {
      setProgress({
        status: "processing",
        step: "Important dades",
        processed: nextJob.processedRows,
        total: nextJob.totalRows,
      });
    } else if (nextJob.status === "finalizing") {
      setProgress({
        status: "finalizing",
        step: "Assignant gestors",
        processed: nextJob.processedRows,
        total: nextJob.totalRows,
      });
    } else if (nextJob.status === "done" || nextJob.status === "error") {
      resetProgress();
    }

    if (nextJob.summary) {
      const summary = nextJob.summary;
      setState({
        summary: {
          fileName: summary.fileName,
          imported: summary.imported,
          assigned: summary.assigned,
          unmatched: summary.unmatched,
          skipped: summary.skipped,
          backfilled: summary.backfilled,
        },
        rowErrors: summary.rowErrors,
        headerErrors: summary.headerErrors,
        error: nextJob.errorMessage ?? undefined,
      });
    } else if (nextJob.errorMessage) {
      setState({ error: nextJob.errorMessage });
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("uploadJobId");
    if (stored) {
      setJobId(stored);
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let interval: NodeJS.Timeout | null = null;
    let active = true;

    const fetchJob = async () => {
      const response = await fetch(`/api/uploads/${jobId}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { job: UploadJob };
      if (!active) return;
      updateFromJob(data.job);
      if (data.job.status === "done" || data.job.status === "error") {
        if (interval) clearInterval(interval);
        interval = null;
      }
    };

    fetchJob();
    interval = setInterval(fetchJob, POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [jobId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProcessing) return;

    setState(initialState);
    setIsProcessing(true);
    setJob(null);

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
      status: "uploading",
      step: "Pujant fitxer",
      processed: 0,
      total: 0,
    });

    try {
      const safeFileName = file.name.replace(/\s+/g, "_");
      const startResponse = await fetch("/api/uploads/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!startResponse.ok) {
        setState({ error: "No s'ha pogut iniciar la carrega." });
        setIsProcessing(false);
        return;
      }

      const { jobId: newJobId } = (await startResponse.json()) as { jobId: string };
      window.localStorage.setItem("uploadJobId", newJobId);
      setJobId(newJobId);
      setIsProcessing(true);

      const blob = await upload(`uploads/${newJobId}/${safeFileName}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads/blob",
        clientPayload: JSON.stringify({ jobId: newJobId }),
        contentType: file.type || undefined,
        onUploadProgress: ({ loaded, total }) => {
          setProgress({
            status: "uploading",
            step: "Pujant fitxer",
            processed: loaded,
            total: total ?? 0,
          });
        },
      });

      const completeResponse = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJobId, blobUrl: blob.url }),
      });

      if (!completeResponse.ok) {
        setState({ error: "No s'ha pogut iniciar el processament del fitxer." });
        setIsProcessing(false);
        resetProgress();
        return;
      }

      setProgress({
        status: "processing",
        step: "Important dades",
        processed: 0,
        total: 0,
      });
    } catch (error) {
      console.error(error);
      setState({ error: "No s'ha pogut processar el fitxer." });
      setIsProcessing(false);
      resetProgress();
    } finally {
      // status updates are handled by polling
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
