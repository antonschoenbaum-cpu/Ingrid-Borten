"use client";

import { useState } from "react";

type Folder = "paintings" | "jewelry" | "events" | "artist";

type Props = {
  folder: Folder;
  label?: string;
  onUploaded: (url: string) => void;
};

export function UploadForm({ folder, label = "Upload billede", onUploaded }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus(null);
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
    setStatus("Uploadet.");
    onUploaded(data.url);
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm text-ink-muted">
        {label}
        <input
          type="file"
          accept="image/*"
          disabled={pending}
          onChange={onChange}
          className="mt-1 block w-full text-sm file:mr-3 file:border file:border-accent/50 file:bg-paper file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-accent"
        />
      </label>
      {pending ? <p className="text-xs text-ink-muted">Uploader…</p> : null}
      {status ? <p className="text-xs text-accent">{status}</p> : null}
    </div>
  );
}
