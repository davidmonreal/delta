export const POLL_INTERVAL_MS = 3000;

export type UploadProgress = {
  status: "idle" | "uploading" | "processing" | "finalizing";
  step: string;
  processed: number;
  total: number;
};

export type UploadJobSummary = {
  fileName: string;
  imported: number;
  assigned: number;
  unmatched: number;
  skipped: number;
  backfilled: number;
  rowErrors?: UploadActionState["rowErrors"];
  headerErrors?: UploadActionState["headerErrors"];
};

export type UploadJobStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "finalizing"
  | "retrying"
  | "done"
  | "error";

export type UploadJob = {
  id: string;
  fileName: string;
  status: UploadJobStatus;
  progress: number;
  processedRows: number;
  totalRows: number;
  summary?: UploadJobSummary | null;
  errorMessage?: string | null;
};

export type UploadActionState = {
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

export const initialUploadActionState: UploadActionState = {};

const processingStatuses = new Set<UploadJobStatus>([
  "pending",
  "uploading",
  "processing",
  "finalizing",
  "retrying",
]);

export function isProcessingStatus(status: UploadJobStatus): boolean {
  return processingStatuses.has(status);
}

export function shouldResetForStatus(status: UploadJobStatus): boolean {
  return status === "done" || status === "error";
}

export function shouldClearJobId(status: UploadJobStatus): boolean {
  return status === "done" || status === "error";
}

export function getProgressUpdate(job: UploadJob): UploadProgress | null {
  if (job.status === "processing") {
    return {
      status: "processing",
      step: "Important dades",
      processed: job.processedRows,
      total: job.totalRows,
    };
  }

  if (job.status === "retrying") {
    return {
      status: "processing",
      step: "Reintentant processament",
      processed: job.processedRows,
      total: job.totalRows,
    };
  }

  if (job.status === "finalizing") {
    return {
      status: "finalizing",
      step: "Assignant gestors (coincidencia exacta)",
      processed: job.processedRows,
      total: job.totalRows,
    };
  }

  if (shouldResetForStatus(job.status)) {
    return { status: "idle", step: "", processed: 0, total: 0 };
  }

  return null;
}

export function buildActionStateFromJob(job: UploadJob): UploadActionState | null {
  if (job.summary) {
    const summary = job.summary;
    return {
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
      error: job.errorMessage ?? undefined,
    };
  }

  if (job.errorMessage) {
    return { error: job.errorMessage };
  }

  return null;
}
