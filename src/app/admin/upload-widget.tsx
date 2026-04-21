"use client";

import { useState } from "react";

const folders = [
  { value: "paintings", label: "Malerier (/uploads/paintings/)" },
  { value: "jewelry", label: "Smykker (/uploads/jewelry/)" },
  { value: "events", label: "Begivenheder (/uploads/events/)" },
  { value: "artist", label: "Portræt (/uploads/artist/)" },
] as const;

export function UploadWidget() {
  const [folder, setFolder] = useState<(typeof folders)[number]["value"]>("paintings");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setPending(true);
    const fd = new FormData();
    fd.append("folder", folder);
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setPending(false);
    if (!res.ok) {
      setStatus("Upload mislykkedes. Er du logget ind?");
      return;
    }
    const data = (await res.json()) as { url: string };
    setStatus(`Gemt: ${data.url} — brug stien i maleri/smykke/begivenhed eller under Om.`);
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block text-sm text-ink-muted">
        Mappe
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value as typeof folder)}
          className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
        >
          {folders.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm text-ink-muted">
          Vælg fil
          <input
            type="file"
            name="file"
            required
            className="mt-1 block w-full text-sm file:mr-3 file:border file:border-accent/50 file:bg-paper file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-accent"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="btn-outline h-10 shrink-0 disabled:opacity-50"
        >
          {pending ? "Uploader…" : "Upload"}
        </button>
      </div>
      {status ? <p className="text-sm text-accent">{status}</p> : null}
    </form>
  );
}
