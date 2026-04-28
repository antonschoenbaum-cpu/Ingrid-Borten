import { getAbout } from "@/lib/data";
import { FrontpageAdmin } from "./frontpage-admin";

export default async function AdminFrontpagePage() {
  const about = await getAbout();
  return <FrontpageAdmin initial={about} />;
}

