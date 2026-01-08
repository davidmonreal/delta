"use client";

import { upload } from "@vercel/blob/client";

import type { UploadJob } from "@/components/admin/uploadDataModel";

type FetchJobResult =
  | { status: "ok"; job: UploadJob }
  | { status: "not_found" }
  | { status: "error" };

export function resolveApiErrorMessage(
  body: unknown,
  fallback: string,
): string {
  if (typeof body === "object" && body && "error" in body) {
    const errorValue = (body as { error?: unknown }).error;
    if (typeof errorValue === "string") {
      return errorValue;
    }
  }
  return fallback;
}

export async function fetchLatestUploadJob(): Promise<UploadJob | null> {
  const response = await fetch("/api/uploads/latest", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { job: UploadJob | null };
  return data.job;
}

export async function fetchUploadJob(jobId: string): Promise<FetchJobResult> {
  const response = await fetch(`/api/uploads/${jobId}`, { cache: "no-store" });
  if (response.status === 404) {
    return { status: "not_found" };
  }
  if (!response.ok) {
    return { status: "error" };
  }
  const data = (await response.json()) as { job: UploadJob };
  return { status: "ok", job: data.job };
}

export async function startUploadJob(fileName: string): Promise<{ jobId: string }> {
  const response = await fetch("/api/uploads/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = resolveApiErrorMessage(
      body,
      "No s'ha pogut iniciar la carrega.",
    );
    throw new Error(message);
  }

  return (await response.json()) as { jobId: string };
}

export async function completeUploadJob(jobId: string, blobUrl: string): Promise<void> {
  const response = await fetch("/api/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, blobUrl }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = resolveApiErrorMessage(
      body,
      "No s'ha pogut iniciar el processament del fitxer.",
    );
    throw new Error(message);
  }
}

export async function uploadFileToBlob({
  jobId,
  file,
  safeFileName,
  onUploadProgress,
}: {
  jobId: string;
  file: File;
  safeFileName: string;
  onUploadProgress: (progress: { loaded: number; total?: number }) => void;
}) {
  return upload(`uploads/${jobId}/${safeFileName}`, file, {
    access: "public",
    handleUploadUrl: "/api/uploads/blob",
    clientPayload: JSON.stringify({ jobId }),
    contentType: file.type || undefined,
    onUploadProgress,
  });
}
