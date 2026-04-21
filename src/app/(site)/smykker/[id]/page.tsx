import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkImage } from "@/components/artwork-image";
import { formatPriceDKK } from "@/lib/format";
import { getJewelry } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const items = await getJewelry();
  const item = items.find((p) => p.id === id);
  if (!item) return { title: "Smykke" };
  return { title: item.title };
}

export default async function SmykkeDetailPage({ params }: Props) {
  const { id } = await params;
  const items = await getJewelry();
  const item = items.find((p) => p.id === id);
  if (!item) notFound();

  const contactHref = `/kontakt?type=smykke&vare=${encodeURIComponent(item.title)}`;

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-20">
      <Link
        href="/smykker"
        className="text-sm uppercase tracking-wider text-ink-muted transition hover:text-ink"
      >
        ← Tilbage til smykker
      </Link>
      <div className="section-rule mt-8 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
        <div className="order-2 md:order-1">
          <h1 className="font-serif text-3xl text-ink md:text-4xl">{item.title}</h1>
          <p className="section-rule mt-6 border-secondary/40 pt-6 font-serif text-2xl text-accent">
            {formatPriceDKK(item.price)}
          </p>
          <p className="section-rule mt-8 border-secondary/40 pt-8 whitespace-pre-wrap leading-relaxed text-ink-muted">
            {item.description}
          </p>
          <Link href={contactHref} className="btn-outline mt-10 inline-flex">
            Forespørg om dette smykke
          </Link>
        </div>
        <div className="order-1 overflow-hidden border border-secondary/50 bg-paper-warm md:order-2">
          <ArtworkImage
            src={item.image}
            alt={item.title}
            className="aspect-square w-full object-cover md:max-h-[min(80vh,640px)]"
            priority
          />
        </div>
      </div>
    </div>
  );
}
