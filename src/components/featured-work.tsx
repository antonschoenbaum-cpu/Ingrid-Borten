import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { formatPriceDKK } from "@/lib/format";
import type { Painting } from "@/types/content";

type Props = {
  painting: Painting | null;
};

export function FeaturedWork({ painting }: Props) {
  if (!painting) return null;

  const desc = painting.description?.trim();

  return (
    <section className="flex min-h-[80vh] flex-col justify-center py-32 md:py-40">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <div className="grid gap-16 md:grid-cols-2 md:items-center md:gap-24">
          <Link
            href={`/malerier/${painting.id}`}
            className="group relative mx-auto block w-full max-w-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:mx-0"
          >
            <ArtworkImage
              src={painting.image}
              alt={painting.title}
              className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          </Link>
          <div className="flex flex-col justify-center md:min-h-0">
            <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gray-500">Udvalgt værk</p>
            <h2 className="mb-6 font-heading text-4xl leading-tight text-gray-900 md:text-5xl">
              {painting.title}
            </h2>
            {desc ? (
              <p className="mb-8 max-w-md text-base leading-relaxed text-gray-700 md:text-lg">
                {desc}
              </p>
            ) : null}
            <p className="mb-8 font-heading text-lg text-gray-900">
              {painting.sold ? (
                <>
                  <span className="text-gray-600 line-through">
                    {formatPriceDKK(painting.price)}
                  </span>
                  <span className="ml-2 text-xs uppercase tracking-wider text-gray-500">(Solgt)</span>
                </>
              ) : (
                formatPriceDKK(painting.price)
              )}
            </p>
            <Link
              href={`/malerier/${painting.id}`}
              className="group/cta inline-flex w-fit text-sm uppercase tracking-[0.18em] text-gray-900"
            >
              <span className="border-b border-gray-900 pb-0.5 transition-[border-color,opacity] duration-300 group-hover/cta:border-gray-500 group-hover/cta:opacity-80">
                SE VÆRKET →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
