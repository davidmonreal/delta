"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  callbackUrl: string;
};

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Credencials incorrectes.");
      setIsSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
        Password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          required
        />
      </label>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-emerald-700 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Entrant..." : "Entrar"}
      </button>
    </form>
  );
}
