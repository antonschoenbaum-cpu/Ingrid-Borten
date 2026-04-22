import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublicAnalytics } from "@/components/PublicAnalytics";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col text-ink">
      <PublicAnalytics />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
