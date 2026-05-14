import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { canUseSupabaseContactRead, readContactFromSupabase } from "@/lib/supabase-contact";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let facebookUrl = "";
  let instagramUrl = "";

  if (canUseSupabaseContactRead()) {
    try {
      const row = await readContactFromSupabase();
      if (row) {
        facebookUrl = (row.facebookUrl ?? "").trim();
        instagramUrl = (row.instagramUrl ?? "").trim();
      }
    } catch {
      // Ignorér midlertidige fejl.
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar artistName={artistName} />
      <main className="flex-1">{children}</main>
      <Footer
        artistName={artistName}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
      />
    </div>
  );
}
