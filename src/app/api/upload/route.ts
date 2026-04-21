import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

const allowedFolders = ["paintings", "jewelry", "events", "artist"] as const;
type Folder = (typeof allowedFolders)[number];

function isFolder(s: string): s is Folder {
  return (allowedFolders as readonly string[]).includes(s);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await req.formData();
  const file = formData.get("file");
  const folderRaw = formData.get("folder");
  const folderStr = typeof folderRaw === "string" ? folderRaw : "";
  if (!isFolder(folderStr)) {
    return NextResponse.json(
      { error: "Ugyldig mappe. Brug paintings, jewelry, events eller artist." },
      { status: 400 },
    );
  }

  if (!file || !(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Manglende fil" }, { status: 400 });
  }

  const original =
    typeof (file as File).name === "string" ? (file as File).name : "upload.bin";
  const safe = original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const name = `${Date.now()}-${safe || "fil"}`;
  const folder = folderStr as Folder;
  const relDir = path.join("public", "uploads", folder);
  const absDir = path.join(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absDir, name), buffer);

  const url = `/uploads/${folder}/${name}`;
  return NextResponse.json({ url });
}
