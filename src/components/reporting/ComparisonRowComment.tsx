"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";

import { createComparisonCommentAction } from "@/app/comments/actions";
import { IconButton } from "@/components/common/IconButton";

type ComparisonRowCommentProps = {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  title: string;
  subtitle?: string;
};

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

export default function ComparisonRowComment({
  clientId,
  serviceId,
  year,
  month,
  title,
  subtitle,
}: ComparisonRowCommentProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);
  const label = useMemo(
    () => (subtitle ? `${title} · ${subtitle}` : title),
    [title, subtitle],
  );

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setState(initialState);
    setIsLoading(true);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    fetch("/api/comments/latest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, serviceId, year, month }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as { comment?: { message?: string } | null };
      })
      .then((data) => {
        if (requestIdRef.current !== requestId) return;
        const existingMessage = data?.comment?.message?.trim() ?? "";
        if (existingMessage) {
          setMessage(existingMessage);
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, [open, clientId, serviceId, year, month]);

  function handleSubmit(kind: "REPORT_ERROR" | "VALIDATE_DIFFERENCE") {
    const trimmed = message.trim();
    if (!trimmed) {
      setState({ error: "Fes una explicació més detallada, si us plau." });
      return;
    }

    const formData = new FormData();
    formData.set("clientId", String(clientId));
    formData.set("serviceId", String(serviceId));
    formData.set("year", String(year));
    formData.set("month", String(month));
    formData.set("kind", kind);
    formData.set("message", trimmed);

    startTransition(async () => {
      const result = await createComparisonCommentAction(initialState, formData);
      setState(result);
      if (result.success) {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <IconButton
        icon={MessageSquare}
        onClick={() => setOpen(true)}
        title="Afegir comentari"
        size="sm"
      />
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Comentari
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                {label}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Explica per què hi ha aquesta diferència.
              </p>
            </div>
            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                Comentari
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  minLength={5}
                  required
                  className="resize-none rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              {isLoading ? (
                <p className="text-xs font-semibold text-slate-400">
                  Carregant comentari...
                </p>
              ) : null}
              {state.error ? (
                <p className="text-sm font-semibold text-red-600">
                  {state.error}
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
              >
                Cancel-lar
              </button>
              <button
                type="button"
                disabled={isPending || !message.trim()}
                onClick={() => handleSubmit("REPORT_ERROR")}
                className="rounded-full border border-emerald-700 px-5 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Reportar error
              </button>
              <button
                type="button"
                disabled={isPending || !message.trim()}
                onClick={() => handleSubmit("VALIDATE_DIFFERENCE")}
                className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                Validar diferència
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
