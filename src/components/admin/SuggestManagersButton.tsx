"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SuggestManagersButtonProps = {
  href: string;
  disabled: boolean;
  suggestionsEnabled: boolean;
};

export default function SuggestManagersButton({
  href,
  disabled,
  suggestionsEnabled,
}: SuggestManagersButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stepIndex, setStepIndex] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const pendingRef = useRef(isPending);
  const finalizeTimerRef = useRef<number | null>(null);
  const steps = useMemo(
    () => [
      "Buscant clients pendents...",
      "Mirant responsables recents...",
      "Preparant suggeriments...",
    ],
    [],
  );

  useEffect(() => {
    if (finalizeTimerRef.current) {
      window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
    if (!isPending) {
      if (pendingRef.current) {
        setIsFinalizing(true);
        finalizeTimerRef.current = window.setTimeout(() => {
          setIsFinalizing(false);
        }, 1800);
      }
      setStepIndex(0);
      pendingRef.current = false;
      return;
    }

    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1200);

    pendingRef.current = true;
    return () => window.clearInterval(timer);
  }, [isPending, steps.length]);

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          router.push(href);
        })
      }
      disabled={disabled || suggestionsEnabled || isPending || isFinalizing}
      className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
        disabled || suggestionsEnabled || isPending || isFinalizing
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-emerald-700 hover:bg-emerald-800"
      }`}
    >
      {isPending
        ? steps[stepIndex]
        : isFinalizing
          ? "Finalitzant..."
          : suggestionsEnabled
            ? "Suggeriments actius"
            : "Suggerir gestors"}
    </button>
  );
}
