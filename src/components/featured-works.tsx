import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { formatPriceDKK } from "@/lib/format";
import type { Painting } from "@/types/content";

function WorkBlock({ painting, solo }: { painting: Painting; solo: boolean }) {
  const desc = painting.description?.trim();
  return (
    <div
      className={
        solo
          ? "grid gap-16 md:grid-cols-2 md:items-center md:gap-24"
          : "grid gap-10 md:grid-cols-2 md:items-center md:gap-16"
      }
    >
      <Link
        href={`/malerier/${painting.id}`}
        className={`group relative mx-auto block w-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:mx-0 ${
          solo ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <ArtworkImage
          src={painting.image}
          alt={painting.title}
          className="h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-col justify-center md:min-h-0">
        {solo ? (
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gray-500">Udvalgt værk</p>
        ) : null}
        <h3
          className={`mb-6 font-heading leading-tight text-gray-900 ${
            solo ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
          }`}
        >
          {painting.title}
        </h3>
        {desc ? (
          <p
            className={`mb-8 max-w-md leading-relaxed text-gray-700 ${
              solo ? "text-base md:text-lg" : "text-base"
            }`}
          >
            {desc}
          </p>
        ) : null}
        <p className={`mb-8 font-heading text-gray-900 ${solo ? "text-lg" : "text-base"}`}>
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
  );
}

type Props = {
  paintings: Painting[];
};

export function FeaturedWorks({ paintings }: Props) {
  if (paintings.length === 0) return null;
  const solo = paintings.length === 1;

  return (
    <section
      className={
        solo
          ? "flex min-h-[80vh] flex-col justify-center py-32 md:py-40"
          : "py-28 md:py-36"
      }
    >
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        {!solo ? (
          <h2 className="mb-16 text-center font-heading text-3xl text-gray-900 md:mb-20 md:text-4xl">
            Udvalgte værker
          </h2>
        ) : null}
        <div className={solo ? "" : "space-y-20 md:space-y-28"}>
          {paintings.map((p) => (
            <WorkBlock key={p.id} painting={p} solo={solo} />
          ))}
        </div>
      </div>
    </section>
  );
}
