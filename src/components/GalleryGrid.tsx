import { ProductCard } from "@/components/ProductCard";

type Item = {
  id: string;
  title: string;
  price: number;
  image: string;
  sold?: boolean;
};

type Props = {
  items: Item[];
  basePath: "/malerier" | "/smykker";
};

export function GalleryGrid({ items, basePath }: Props) {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {items.map((item) => (
        <div key={item.id} className="mb-6">
          <ProductCard item={item} href={`${basePath}/${item.id}`} />
        </div>
      ))}
    </div>
  );
}
