import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col text-ink">
      <Navbar artistName={artistName} />
      <main className="flex-1">{children}</main>
      <Footer artistName={artistName} />
    </div>
  );
}
