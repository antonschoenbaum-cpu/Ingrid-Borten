"use client";

import { useState } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";

type Props = {
  email: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  initialMessage: string;
  artistName: string;
};

function hasUrl(s: string | null | undefined) {
  return typeof s === "string" && s.trim().length > 0;
}

export function ContactSection({
  email,
  facebookUrl,
  instagramUrl,
  initialMessage,
  artistName,
}: Props) {
  const [name, setName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const safeFacebookUrl = hasUrl(facebookUrl) ? (facebookUrl ?? "").trim() : "";
  const safeInstagramUrl = hasUrl(instagramUrl) ? (instagramUrl ?? "").trim() : "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: fromEmail.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setFromEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-14">
      <div className="text-center">
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center justify-center text-sm text-gray-700 transition hover:text-gray-900"
        >
          {email}
        </a>
      </div>

      {safeFacebookUrl || safeInstagramUrl ? (
        <div className="flex justify-center gap-4">
          {safeFacebookUrl ? (
            <a
              href={safeFacebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 transition hover:text-gray-900"
              aria-label={`${artistName} på Facebook`}
            >
              <FacebookIcon className="h-6 w-6 fill-current" />
            </a>
          ) : null}
          {safeInstagramUrl ? (
            <a
              href={safeInstagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 transition hover:text-gray-900"
              aria-label={`${artistName} på Instagram`}
            >
              <InstagramIcon className="h-6 w-6 fill-current" />
            </a>
          ) : null}
        </div>
      ) : null}

      <section>
        <h2 className="mb-6 text-center font-serif text-xl text-ink">Send en besked</h2>
        <form
          onSubmit={submit}
          className="mx-auto max-w-lg space-y-5 border border-ink/10 bg-paper p-8 shadow-sm"
        >
          <label className="block text-sm text-ink-muted">
            Navn
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-ink/15 bg-paper-warm px-3 py-2 text-ink outline-none ring-sage-muted/40 focus:ring-2"
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Din e-mail
            <input
              required
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="mt-1 w-full border border-ink/15 bg-paper-warm px-3 py-2 text-ink outline-none ring-sage-muted/40 focus:ring-2"
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Besked
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full resize-y border border-ink/15 bg-paper-warm px-3 py-2 text-ink outline-none ring-sage-muted/40 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full border border-ink bg-ink py-3 text-sm uppercase tracking-widest text-paper transition hover:bg-ink/90"
          >
            {pending ? "Sender..." : "Send besked"}
          </button>
          {status === "success" ? (
            <p className="text-center text-sm text-sage-deep">Besked sendt!</p>
          ) : null}
          {status === "error" ? (
            <p className="text-center text-sm text-rose-dust">Noget gik galt, prøv igen</p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
