import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkImage } from "@/components/artwork-image";
import { SoldPrice } from "@/components/SoldPrice";
import { getPaintings } from "@/lib/data";
import { readArtistSettings } from "@/lib/webshop";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const items = await getPaintings();
  const item = items.find((p) => p.id === id);
  if (!item) return { title: "Maleri" };
  return { title: item.title };
}

export default async function MaleriDetailPage({ params }: Props) {
  const { id } = await params;
  const [items, artistSettings] = await Promise.all([getPaintings(), readArtistSettings(false)]);
  const item = items.find((p) => p.id === id);
  if (!item) notFound();

  const contactHref = `/kontakt?type=maleri&vare=${encodeURIComponent(item.title)}`;
  const canBuy = artistSettings.paymentsEnabled && item.sold !== true && (item.stock ?? 1) > 0;
  const isSold = item.sold === true || (item.stock ?? 1) <= 0;
  const checkoutHref = `/checkout/paintings/${item.id}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
      <Link
        href="/malerier"
        className="text-sm uppercase tracking-wider text-ink-muted transition hover:text-ink"
      >
        ← Tilbage til malerier
      </Link>
      <div className="section-rule mt-8 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
        <div className="overflow-hidden border border-secondary/50 bg-paper-warm">
          <ArtworkImage
            src={item.image}
            alt={item.title}
            className="w-full object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-ink md:text-4xl">{item.title}</h1>
          <p className="section-rule mt-6 border-secondary/40 pt-6">
            <SoldPrice price={item.price} sold={item.sold} size="detail" />
          </p>
          <p className="section-rule mt-8 border-secondary/40 pt-8 whitespace-pre-wrap leading-relaxed text-ink-muted">
            {item.description}
          </p>
          {canBuy ? (
            <Link href={checkoutHref} className="btn-outline-dark mt-10 inline-flex">
              {`Køb nu — ${item.price.toLocaleString("da-DK")} kr.`}
            </Link>
          ) : null}
          {isSold ? (
            <span className="mt-10 inline-flex border border-accent/40 bg-paper px-4 py-2 text-sm uppercase tracking-wider text-accent">
              Solgt
            </span>
          ) : null}
          {!artistSettings.paymentsEnabled ? (
            <Link
              href={contactHref}
              className="mt-10 inline-flex text-sm text-ink-muted underline underline-offset-4 transition hover:text-ink"
            >
              Forespørg om dette værk
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
