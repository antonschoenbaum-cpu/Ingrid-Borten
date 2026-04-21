"use server";

import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import type { ContactLinks } from "@/types/content";

async function assertAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

function normalizeOptionalHttpUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error("INVALID_URL");
  }
  return withScheme;
}

export async function saveContactLinks(data: ContactLinks) {
  await assertAdmin();
  let facebookUrl: string;
  let instagramUrl: string;
  try {
    facebookUrl = normalizeOptionalHttpUrl(data.facebookUrl ?? "");
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_URL") {
      throw new Error("Ugyldig Facebook-adresse");
    }
    throw e;
  }
  try {
    instagramUrl = normalizeOptionalHttpUrl(data.instagramUrl ?? "");
  } catch (e) {
    if (e instanceof Error && e.message === "INVALID_URL") {
      throw new Error("Ugyldig Instagram-adresse");
    }
    throw e;
  }
  const file = path.join(process.cwd(), "data", "contact.json");
  await fs.writeFile(
    file,
    JSON.stringify({ facebookUrl, instagramUrl }, null, 2),
    "utf-8",
  );
  revalidatePath("/kontakt");
  revalidatePath("/admin/kontakt");
}
