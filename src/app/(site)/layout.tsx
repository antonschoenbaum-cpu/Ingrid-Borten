import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { readArtistSettings } from "@/lib/supabase-artist-settings";
import { canUseSupabaseContactRead, readContactFromSupabase } from "@/lib/supabase-contact";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

const FALLBACK_ATELIER = "Nygårdsvej 37, 1.tv\n2100 København Ø";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let atelierAddress = FALLBACK_ATELIER;
  let facebookUrl = "";
  let instagramUrl = "";

  try {
    const settings = await readArtistSettings();
    const line1 = settings.artistAddress?.trim() ?? "";
    const line2 = [settings.artistZip?.trim(), settings.artistCity?.trim()].filter(Boolean).join(" ");
    if (line1 || line2) {
      atelierAddress = [line1, line2].filter(Boolean).join("\n");
    }
  } catch {
    // Behold standardadresse ved fejl.
  }

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

  const contactEmail = (process.env.CONTACT_EMAIL ?? "").trim();

  return (
    <div className="flex min-h-full flex-col">
      <Navbar artistName={artistName} />
      <main className="flex-1">{children}</main>
      <Footer
        artistName={artistName}
        atelierAddress={atelierAddress}
        email={contactEmail}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
      />
    </div>
  );
}
