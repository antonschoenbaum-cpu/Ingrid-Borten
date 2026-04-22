import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/require-admin";

const allowedFolders = ["paintings", "jewelry", "events", "artist"] as const;
type Folder = (typeof allowedFolders)[number];

function isFolder(s: string): s is Folder {
  return (allowedFolders as readonly string[]).includes(s);
}

function getSupabaseUploadClient() {
  const rawUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const url = rawUrl.trim();
  if (!url || !serviceRole) return null;
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL er ugyldig. Den skal være en fuld URL som https://<project-ref>.supabase.co",
    );
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_REGION || process.cwd().startsWith("/var/task"));
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
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

    if (!file || typeof (file as Blob).arrayBuffer !== "function" || (file as Blob).size === 0) {
      return NextResponse.json({ error: "Manglende fil." }, { status: 400 });
    }

    const original = typeof (file as File).name === "string" ? (file as File).name : "upload.bin";
    const safe = original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const name = `${Date.now()}-${safe || "fil"}`;
    const folder = folderStr as Folder;
    const relDir = path.join("public", "uploads", folder);
    const absDir = path.join(process.cwd(), relDir);
    const buffer = Buffer.from(await (file as Blob).arrayBuffer());

    // Produktion/serverless: brug Supabase Storage, da local filesystem ikke er persistent.
    const supabase = getSupabaseUploadClient();
    if (supabase) {
      const objectPath = `${folder}/${name}`;
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(objectPath, buffer, {
          contentType: (file as File).type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) {
        return NextResponse.json(
          {
            error: `Upload til Supabase fejlede: ${uploadError.message}. Tjek at bucketen "uploads" findes og er offentlig.`,
          },
          { status: 500 },
        );
      }
      const { data } = supabase.storage.from("uploads").getPublicUrl(objectPath);
      return NextResponse.json({ url: data.publicUrl });
    }

    if (isServerlessRuntime()) {
      return NextResponse.json(
        {
          error:
            "Upload kan ikke bruge lokalt filsystem i dette miljø. Sæt NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY i deployment-miljøet.",
        },
        { status: 500 },
      );
    }

    await mkdir(absDir, { recursive: true });
    await writeFile(path.join(absDir, name), buffer);
    return NextResponse.json({ url: `/uploads/${folder}/${name}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    if (msg.includes("EROFS") || msg.includes("read-only")) {
      return NextResponse.json(
        {
          error:
            "Upload fejlede: serverens filsystem er skrivebeskyttet. Lokale uploads til /public virker typisk ikke på serverless hosting.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: `Upload fejlede på serveren: ${msg}` },
      { status: 500 },
    );
  }
}
