"use client";

import { useState } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";
import { Mail } from "lucide-react";

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
          className="inline-flex items-center gap-3 font-serif text-xl text-ink transition hover:text-sage-deep"
        >
          <Mail className="size-5 shrink-0 text-sage-deep" strokeWidth={1.5} />
          {email}
        </a>
      </div>

      {hasUrl(facebookUrl) || hasUrl(instagramUrl) ? (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          {hasUrl(facebookUrl) ? (
            <a
              href={facebookUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-ink-muted transition hover:text-ink"
            >
              <FacebookIcon className="size-5" />
              {artistName} på Facebook
            </a>
          ) : null}
          {hasUrl(instagramUrl) ? (
            <a
              href={instagramUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-ink-muted transition hover:text-ink"
            >
              <InstagramIcon className="size-5" />
              {artistName} på Instagram
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
