"use client";

import { useState } from "react";
import type { ContactLinks } from "@/types/content";

type Props = {
  initial: ContactLinks;
};

export function ContactLinksEditor({ initial }: Props) {
  const [facebookUrl, setFacebookUrl] = useState(initial.facebookUrl);
  const [instagramUrl, setInstagramUrl] = useState(initial.instagramUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setMsg(null);
    setErr(null);
    setPending(true);
    try {
      const res = await fetch("/api/contact-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facebookUrl, instagramUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as ContactLinks & { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Kunne ikke gemme.");
        return;
      }
      if (typeof data.facebookUrl === "string") setFacebookUrl(data.facebookUrl);
      if (typeof data.instagramUrl === "string") setInstagramUrl(data.instagramUrl);
      setMsg("Gemt. Linkene bruges på kontaktsiden.");
    } catch {
      setErr("Kunne ikke gemme.");
    }
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Indsæt fulde adresser (fx <code className="rounded bg-linen px-1">https://facebook.com/…</code>
        ). Tomt felt skjuler det pågældende link på kontaktsiden. Du kan udelade{" "}
        <code className="rounded bg-linen px-1">https://</code> — det tilføjes automatisk.
      </p>
      <label className="block text-sm text-ink-muted">
        Facebook-profil
        <p className="mt-1 text-xs text-ink-muted">
          Indsæt din Facebook-sides fulde URL, fx https://facebook.com/ditnavnher
        </p>
        <input
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="https://facebook.com/ditnavnher"
          className="mt-1 w-full border border-ink/15 bg-paper-warm px-3 py-2 text-ink"
        />
      </label>
      <label className="block text-sm text-ink-muted">
        Instagram-profil
        <p className="mt-1 text-xs text-ink-muted">
          Indsæt din Instagram-profils fulde URL, fx https://instagram.com/ditnavnher
        </p>
        <input
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="https://instagram.com/ditnavnher"
          className="mt-1 w-full border border-ink/15 bg-paper-warm px-3 py-2 text-ink"
        />
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={pending}
        className="border border-ink bg-ink px-6 py-2 text-sm uppercase tracking-widest text-paper hover:bg-ink/90 disabled:opacity-50"
      >
        {pending ? "Gemmer…" : "Gem links"}
      </button>
      {msg ? <p className="text-sm text-sage-deep">{msg}</p> : null}
      {err ? <p className="text-sm text-rose-dust">{err}</p> : null}
    </div>
  );
}
