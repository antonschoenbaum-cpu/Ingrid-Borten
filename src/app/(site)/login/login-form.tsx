"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });
    setPending(false);
    if (res?.error) {
      setError("Forkert brugernavn eller adgangskode.");
      return;
    }
    router.push(res?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <label className="block text-sm text-ink-muted">
        Brugernavn
        <input
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full border border-ink/15 bg-paper-warm px-3 py-2 text-ink outline-none ring-sage-muted/40 focus:ring-2"
          required
        />
      </label>
      <label className="block text-sm text-ink-muted">
        Adgangskode
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-ink/15 bg-paper-warm px-3 py-2 text-ink outline-none ring-sage-muted/40 focus:ring-2"
          required
        />
      </label>
      {error ? <p className="text-sm text-rose-dust">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn-outline-dark w-full py-3 disabled:opacity-60">
        {pending ? "Logger ind…" : "Log ind"}
      </button>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="mt-10 h-48 animate-pulse rounded bg-linen/40" />}>
      <LoginFields />
    </Suspense>
  );
}
