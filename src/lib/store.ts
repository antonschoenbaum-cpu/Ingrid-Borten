import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import type { AboutData, EventItem, Jewelry, Painting } from "@/types/content";

const root = process.cwd();
const dataDir = path.join(root, "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(dataDir, file), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, data: unknown) {
  await fs.writeFile(
    path.join(dataDir, file),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export async function readPaintings(): Promise<Painting[]> {
  return readJson<Painting[]>("paintings.json");
}

export async function writePaintings(items: Painting[]) {
  await writeJson("paintings.json", items);
}

export async function readJewelry(): Promise<Jewelry[]> {
  return readJson<Jewelry[]>("jewelry.json");
}

export async function writeJewelry(items: Jewelry[]) {
  await writeJson("jewelry.json", items);
}

export async function readEvents(): Promise<EventItem[]> {
  return readJson<EventItem[]>("events.json");
}

export async function writeEvents(items: EventItem[]) {
  await writeJson("events.json", items);
}

export async function readAbout(): Promise<AboutData> {
  return readJson<AboutData>("about.json");
}

export async function writeAbout(data: AboutData) {
  await writeJson("about.json", data);
}

export function revalidatePublicContent() {
  revalidatePath("/");
  revalidatePath("/om");
  revalidatePath("/malerier");
  revalidatePath("/smykker");
  revalidatePath("/begivenheder");
}

export function revalidateAboutPaths() {
  revalidatePath("/om");
}
