"use client";

import { useState } from "react";
import { FacebookIcon, InstagramIcon } from "@/components/social-icons";
import { Mail } from "lucide-react";

type Props = {
  email: string;
  facebookUrl: string;
  instagramUrl: string;
  initialMessage: string;
};

function hasUrl(s: string) {
  return s.trim().length > 0;
}

export function ContactSection({
  email,
  facebookUrl,
  instagramUrl,
  initialMessage,
}: Props) {
  const [name, setName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [message, setMessage] = useState(initialMessage);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent("Henvendelse fra hjemmeside");
    const body = encodeURIComponent(
      `Navn: ${name}\nE-mail: ${fromEmail}\n\n${message}`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-14">
      <div className="border border-ink/10 bg-paper-warm/60 p-8 text-center shadow-sm">
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-3 font-serif text-xl text-ink transition hover:text-sage-deep"
        >
          <Mail className="size-5 shrink-0 text-sage-deep" strokeWidth={1.5} />
          {email}
        </a>
        <p className="mt-3 text-sm text-ink-muted">
          E-mail kan ændres i miljøvariablen{" "}
          <code className="rounded bg-linen px-1">CONTACT_EMAIL</code>. Facebook- og
          Instagram-links redigeres under{" "}
          <span className="whitespace-nowrap">Admin → Sociale medier</span>, når du er logget
          ind. Biografi og portræt under <span className="whitespace-nowrap">Admin → Om</span>.
        </p>
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
              Ingrid Borten på Facebook
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
              Ingrid Borten på Instagram
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
            className="w-full border border-ink bg-ink py-3 text-sm uppercase tracking-widest text-paper transition hover:bg-ink/90"
          >
            Åbn e-mailprogram
          </button>
          <p className="text-center text-xs text-ink-muted">
            Formularen åbner dit standard e-mailprogram med beskeden — ingen serverafsendelse.
          </p>
        </form>
      </section>
    </div>
  );
}
