import { PaintingsAdmin } from "./paintings-admin";
import { getPaintings } from "@/lib/data";

export default async function AdminPaintingsPage() {
  const items = await getPaintings();
  return (
    <PaintingsAdmin
      key={items.map((p) => `${p.id}:${p.title}:${p.price}:${p.image}`).join("|")}
      initial={items}
    />
  );
}
