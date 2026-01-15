"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  POLL_INTERVAL_MS,
  buildActionStateFromJob,
  getProgressUpdate,
  initialUploadActionState,
  isProcessingStatus,
  shouldClearJobId,
  shouldResetForStatus,
  type UploadActionState,
  type UploadJob,
  type UploadProgress,
} from "@/components/admin/uploadDataModel";
import {
  completeUploadJob,
  fetchLatestUploadJob,
  fetchUploadJob,
  startUploadJob,
  uploadFileToBlob,
} from "@/components/admin/uploadGateway";
import PaginationControls from "@/components/common/PaginationControls";

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
          : "Recalculem les assignacions pendents mentre la càrrega avança."}
      </p>
    </div>
  );
}

export default function UploadDataPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadActionState>(initialUploadActionState);
  const [progress, setProgress] = useState<UploadProgress>({
    status: "idle",
    step: "",
    processed: 0,
    total: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const pageSize = 20;
  const [errorsPage, setErrorsPage] = useState(1);

  const resetProgress = () => {
    setProgress({ status: "idle", step: "", processed: 0, total: 0 });
  };

  const updateFromJob = (nextJob: UploadJob) => {
    setIsProcessing(isProcessingStatus(nextJob.status));

    const nextProgress = getProgressUpdate(nextJob);
    if (nextProgress) {
      setProgress(nextProgress);
    }

    if (shouldResetForStatus(nextJob.status)) {
      setHasFile(false);
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    const nextState = buildActionStateFromJob(nextJob);
    if (nextState) {
      setState(nextState);
    }

    if (shouldClearJobId(nextJob.status)) {
      setJobId(null);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchLatest = async () => {
      const latestJob = await fetchLatestUploadJob();
      if (!active) return;
      if (latestJob) {
        setJobId(latestJob.id);
        updateFromJob(latestJob);
      }
    };
    fetchLatest();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let interval: NodeJS.Timeout | null = null;
    let active = true;

    const fetchJob = async () => {
      const result = await fetchUploadJob(jobId);
      if (result.status === "not_found") {
        setJobId(null);
        setIsProcessing(false);
        resetProgress();
        return;
      }
      if (result.status !== "ok") return;
      if (!active) return;
      updateFromJob(result.job);
      if (result.job.status === "done" || result.job.status === "error") {
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

  useEffect(() => {
    setErrorsPage(1);
  }, [state.rowErrors]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isProcessing) return;

    setState(initialUploadActionState);
    setIsProcessing(true);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setState({ error: "Selecciona un fitxer per pujar." });
      setIsProcessing(false);
      setHasFile(false);
      setSelectedFileName(null);
      return;
    }
    if (!file.name || file.size === 0) {
      setState({ error: "El fitxer esta buit." });
      setIsProcessing(false);
      setHasFile(false);
      setSelectedFileName(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) {
      setState({ error: "El fitxer ha de ser Excel o CSV." });
      setIsProcessing(false);
      setHasFile(false);
      setSelectedFileName(null);
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
      const { jobId: newJobId } = await startUploadJob(file.name);
      setJobId(newJobId);
      setIsProcessing(true);

      const blob = await uploadFileToBlob({
        jobId: newJobId,
        file,
        safeFileName,
        onUploadProgress: ({ loaded, total }) => {
          setProgress({
            status: "uploading",
            step: "Pujant fitxer",
            processed: loaded,
            total: total ?? 0,
          });
        },
      });

      await completeUploadJob(newJobId, blob.url);

      setProgress({
        status: "processing",
        step: "Important dades",
        processed: 0,
        total: 0,
      });
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "No s'ha pogut processar el fitxer.";
      setState({ error: message });
      setIsProcessing(false);
      resetProgress();
      setHasFile(false);
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <label
              htmlFor="upload-file"
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-white shadow-sm transition ${
                isProcessing
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              Selecciona arxiu
            </label>
            <span className="truncate text-sm text-slate-600">
              {selectedFileName ?? "No file selected"}
            </span>
            <input
              id="upload-file"
              type="file"
              name="file"
              accept=".xlsx,.csv"
              required
              disabled={isProcessing}
              ref={fileInputRef}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setHasFile(Boolean(file));
                setSelectedFileName(file?.name ?? null);
              }}
              className="absolute left-0 top-0 h-0 w-0 overflow-hidden opacity-0"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !hasFile}
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
            <p className="font-semibold">Capçalera incorrecta.</p>
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
            <p className="font-semibold">Càrrega finalitzada.</p>
            <p className="mt-1">
              Fitxer: <span className="font-semibold">{state.summary.fileName}</span>
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Línies importades:{" "}
                <span className="font-semibold">{state.summary.imported}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Assignades automàticament:{" "}
                <span className="font-semibold">{state.summary.assigned}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Sense responsable:{" "}
                <span className="font-semibold">{state.summary.unmatched}</span>
              </div>
              <div className="rounded-xl bg-white px-3 py-2 text-slate-700">
                Línies amb error:{" "}
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
              {state.rowErrors
                .slice(
                  (errorsPage - 1) * pageSize,
                  errorsPage * pageSize,
                )
                .map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  Linia {error.row}: {error.message}
                </li>
              ))}
            </ul>
            <PaginationControls
              page={errorsPage}
              totalItems={state.rowErrors.length}
              pageSize={pageSize}
              onPageChange={setErrorsPage}
              className="mt-3"
            />
          </div>
        ) : null}
      </form>
    </section>
  );
}
