import { getAbout, getPaintings } from "@/lib/data";
import { FrontpageAdmin } from "./frontpage-admin";

export default async function AdminFrontpagePage() {
  const [about, paintings] = await Promise.all([getAbout(), getPaintings()]);
  const paintingChoices = [...paintings].sort((a, b) =>
    a.title.localeCompare(b.title, "da", { sensitivity: "base" }),
  );
  return <FrontpageAdmin initial={about} paintings={paintingChoices} />;
}
