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
  const raw = await readJson<Array<Painting & { sold?: boolean }>>("paintings.json");
  return raw.map((p) => ({ ...p, sold: p.sold === true }));
}

export async function writePaintings(items: Painting[]) {
  await writeJson("paintings.json", items);
}

export async function readJewelry(): Promise<Jewelry[]> {
  const raw = await readJson<Array<Jewelry & { sold?: boolean }>>("jewelry.json");
  return raw.map((p) => ({ ...p, sold: p.sold === true }));
}

export async function writeJewelry(items: Jewelry[]) {
  await writeJson("jewelry.json", items);
}

/** Rå JSON kan have ældre felt `date` i stedet for start_date/end_date. */
type RawEventRow = {
  id: string;
  title: string;
  location: string;
  description: string;
  image?: string | null;
  start_date?: string;
  end_date?: string;
  date?: string;
};

function normalizeEventRow(raw: RawEventRow): EventItem {
  if (raw.start_date && raw.end_date) {
    return {
      id: raw.id,
      title: raw.title,
      start_date: raw.start_date,
      end_date: raw.end_date.slice(0, 10),
      location: raw.location,
      description: raw.description,
      image: raw.image ?? null,
    };
  }
  const d = (raw.date ?? "1970-01-01").slice(0, 10);
  return {
    id: raw.id,
    title: raw.title,
    start_date: `${d}T12:00:00`,
    end_date: d,
    location: raw.location,
    description: raw.description,
    image: raw.image ?? null,
  };
}

export async function readEvents(): Promise<EventItem[]> {
  const raw = await readJson<RawEventRow[]>("events.json");
  return raw.map(normalizeEventRow);
}

export async function writeEvents(items: EventItem[]) {
  await writeJson("events.json", items);
}

export async function readAbout(): Promise<AboutData> {
  const data = await readJson<AboutData>("about.json");
  return {
    ...data,
    cvEntries: Array.isArray(data.cvEntries) ? data.cvEntries : [],
  };
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
