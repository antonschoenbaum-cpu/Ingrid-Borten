import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { SoldStamp } from "@/components/sold-stamp";
import { formatPriceDKK } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  price: number;
  image: string;
  sold?: boolean;
};

type Props = {
  item: Item;
  href: string;
};

export function ProductCard({ item, href }: Props) {
  const sold = item.sold === true;
  return (
    <Link href={href} className="group block cursor-pointer">
      <article className="overflow-hidden">
        <div className="relative overflow-hidden">
          <ArtworkImage
            src={item.image}
            alt={item.title}
            className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {sold ? <SoldStamp /> : null}
        </div>
        <h2 className="mt-4 font-heading text-lg text-gray-900">{item.title}</h2>
        <p className="mt-1 text-sm text-gray-600">
          {sold ? (
            <>
              <span className="line-through">{formatPriceDKK(item.price)}</span>
              <span className="ml-2 text-xs uppercase tracking-wider text-gray-500">(SOLGT)</span>
            </>
          ) : (
            formatPriceDKK(item.price)
          )}
        </p>
      </article>
    </Link>
  );
}
