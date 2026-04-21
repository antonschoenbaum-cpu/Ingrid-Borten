import Link from "next/link";
import { ArtworkImage } from "@/components/artwork-image";
import { formatPriceDKK } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  price: number;
  image: string;
};

type Props = {
  item: Item;
  href: string;
};

export function ProductCard({ item, href }: Props) {
  return (
    <Link href={href} className="group block break-inside-avoid">
      <article className="overflow-hidden border border-secondary/50 bg-paper transition duration-300 hover:border-accent/40 hover:shadow-md">
        <div className="overflow-hidden">
          <ArtworkImage
            src={item.image}
            alt={item.title}
            className="w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
        <div className="section-rule px-4 py-4">
          <h2 className="font-serif text-lg text-ink">{item.title}</h2>
          <p className="mt-2 font-serif text-lg text-accent">{formatPriceDKK(item.price)}</p>
        </div>
      </article>
    </Link>
  );
}
