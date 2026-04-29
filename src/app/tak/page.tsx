import type { Metadata } from "next";
import Stripe from "stripe";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export default async function ThankYouPage({ searchParams }: { searchParams?: SearchParams }) {
  const artistName = (process.env.ARTIST_NAME ?? "Kunstneren").trim() || "Kunstneren";
  const sp = searchParams ? await searchParams : {};
  const sessionId = pickString(sp.session_id);

  let productTitle = "Dit værk";
  let amount = 0;
  let pickupPoint = "";

  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (sessionId && key) {
    try {
      const stripe = new Stripe(key);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      productTitle = String(session.metadata?.product_title ?? "Dit værk");
      amount = Number(session.amount_total ?? 0);
      pickupPoint = String(session.metadata?.pickup_point_id ?? "");
    } catch {
      // Ignoreres: viser fallback-tekst.
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-center md:px-8 md:py-24">
      <div className="rounded border border-secondary/50 bg-paper-warm/50 p-10 shadow-sm">
        <h1 className="font-serif text-4xl text-ink md:text-5xl">Tak for dit køb!</h1>
        <p className="mt-4 text-ink-muted">
          Tak fordi du handler hos {artistName}. Vi har modtaget din ordre.
        </p>
        <div className="section-rule mt-8 space-y-2 pt-8 text-sm text-ink-muted">
          <p>
            <span className="font-medium text-ink">Produkt:</span> {productTitle}
          </p>
          <p>
            <span className="font-medium text-ink">Pris:</span>{" "}
            {(amount / 100).toLocaleString("da-DK")} kr.
          </p>
          <p>
            <span className="font-medium text-ink">Pakkeshop:</span>{" "}
            {pickupPoint || "Valgt i checkout"}
          </p>
        </div>
        <p className="mt-8 text-sm text-ink-muted">
          Vi har sendt en bekræftelsesmail med de vigtigste oplysninger.
        </p>
      </div>
    </div>
  );
}

