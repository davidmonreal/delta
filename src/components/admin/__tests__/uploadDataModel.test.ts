import { describe, expect, it } from "vitest";

import {
  buildActionStateFromJob,
  getProgressUpdate,
  isProcessingStatus,
  shouldClearJobId,
  shouldResetForStatus,
  type UploadJob,
} from "@/components/admin/uploadDataModel";

const baseJob: UploadJob = {
  id: "job-1",
  fileName: "test.xlsx",
  status: "pending",
  progress: 0,
  processedRows: 0,
  totalRows: 0,
  summary: null,
  errorMessage: null,
};

describe("uploadDataModel", () => {
  it("identifies processing statuses", () => {
    expect(isProcessingStatus("pending")).toBe(true);
    expect(isProcessingStatus("uploading")).toBe(true);
    expect(isProcessingStatus("processing")).toBe(true);
    expect(isProcessingStatus("finalizing")).toBe(true);
    expect(isProcessingStatus("retrying")).toBe(true);
    expect(isProcessingStatus("done")).toBe(false);
    expect(isProcessingStatus("error")).toBe(false);
  });

  it("derives progress updates for processing states", () => {
    expect(getProgressUpdate({ ...baseJob, status: "processing", processedRows: 5, totalRows: 10 }))
      .toMatchObject({ status: "processing", processed: 5, total: 10 });
    expect(getProgressUpdate({ ...baseJob, status: "retrying", processedRows: 2, totalRows: 4 }))
      .toMatchObject({ status: "processing", processed: 2, total: 4 });
    expect(getProgressUpdate({ ...baseJob, status: "finalizing", processedRows: 1, totalRows: 3 }))
      .toMatchObject({ status: "finalizing", processed: 1, total: 3 });
  });

  it("returns idle progress for done or error and null for pending/uploading", () => {
    expect(getProgressUpdate({ ...baseJob, status: "pending" })).toBeNull();
    expect(getProgressUpdate({ ...baseJob, status: "uploading" })).toBeNull();
    expect(getProgressUpdate({ ...baseJob, status: "done" })).toMatchObject({ status: "idle" });
    expect(getProgressUpdate({ ...baseJob, status: "error" })).toMatchObject({ status: "idle" });
  });

  it("maps summary and error data into action state", () => {
    const summaryJob: UploadJob = {
      ...baseJob,
      status: "done",
      errorMessage: "warning",
      summary: {
        fileName: "file.xlsx",
        imported: 1,
        assigned: 2,
        unmatched: 3,
        skipped: 4,
        backfilled: 5,
        rowErrors: [{ row: 1, message: "oops" }],
        headerErrors: { missing: ["a"], extra: ["b"] },
      },
    };
    const summaryState = buildActionStateFromJob(summaryJob);
    expect(summaryState?.summary?.fileName).toBe("file.xlsx");
    expect(summaryState?.rowErrors).toHaveLength(1);
    expect(summaryState?.headerErrors?.missing).toEqual(["a"]);
    expect(summaryState?.error).toBe("warning");

    const errorState = buildActionStateFromJob({
      ...baseJob,
      status: "error",
      errorMessage: "fail",
    });
    expect(errorState).toEqual({ error: "fail" });
  });

  it("flags reset conditions for done and error", () => {
    expect(shouldResetForStatus("done")).toBe(true);
    expect(shouldResetForStatus("error")).toBe(true);
    expect(shouldResetForStatus("processing")).toBe(false);
    expect(shouldClearJobId("done")).toBe(true);
    expect(shouldClearJobId("error")).toBe(true);
  });
});
