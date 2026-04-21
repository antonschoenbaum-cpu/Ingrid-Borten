import { AboutAdmin } from "./about-admin";
import { getAbout } from "@/lib/data";

export default async function AdminAboutPage() {
  const about = await getAbout();
  return <AboutAdmin key={JSON.stringify(about)} initial={about} />;
}
