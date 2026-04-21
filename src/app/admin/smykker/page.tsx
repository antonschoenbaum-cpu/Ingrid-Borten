import { JewelryAdmin } from "./jewelry-admin";
import { getJewelry } from "@/lib/data";

export default async function AdminJewelryPage() {
  const items = await getJewelry();
  return (
    <JewelryAdmin
      key={items.map((p) => `${p.id}:${p.title}:${p.price}:${p.image}`).join("|")}
      initial={items}
    />
  );
}
