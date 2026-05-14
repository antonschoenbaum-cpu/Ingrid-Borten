import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { readArtistSettings } from "@/lib/supabase-artist-settings";
import { canUseSupabaseContactRead, readContactFromSupabase } from "@/lib/supabase-contact";

const artistName = (process.env.ARTIST_NAME ?? "Kunstnernavn").trim() || "Kunstnernavn";

const FALLBACK_ADDRESS_1 = "Nygårdsvej 37, 1.tv";
const FALLBACK_ADDRESS_2 = "2100 København Ø";

function atelierLinesFromSettings(
  artistAddress: string,
  artistZip: string,
  artistCity: string,
): { line1: string; line2: string } {
  const l1 = artistAddress.trim();
  const l2 = [artistZip.trim(), artistCity.trim()].filter(Boolean).join(" ");
  return {
    line1: l1 || FALLBACK_ADDRESS_1,
    line2: l2 || FALLBACK_ADDRESS_2,
  };
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let facebookUrl = "";
  let instagramUrl = "";
  let addressLine1 = FALLBACK_ADDRESS_1;
  let addressLine2 = FALLBACK_ADDRESS_2;

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

  try {
    const settings = await readArtistSettings();
    const { line1, line2 } = atelierLinesFromSettings(
      settings.artistAddress,
      settings.artistZip,
      settings.artistCity,
    );
    addressLine1 = line1;
    addressLine2 = line2;
  } catch {
    // Behold fallback-adresse.
  }

  const contactEmail = (process.env.CONTACT_EMAIL ?? "").trim();

  return (
    <div className="flex min-h-full flex-col">
      <Navbar artistName={artistName} />
      <main className="flex-1">{children}</main>
      <Footer
        artistName={artistName}
        email={contactEmail}
        addressLine1={addressLine1}
        addressLine2={addressLine2}
        facebookUrl={facebookUrl}
        instagramUrl={instagramUrl}
      />
    </div>
  );
}
