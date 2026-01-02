"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

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
    <div className="page">
      <section className="card">
        <h1>Acces</h1>
        <p className="subtitle">Introdueix el teu email i password.</p>
        <form className="filters" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p>{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrant..." : "Entrar"}
          </button>
        </form>
      </section>
    </div>
  );
}
