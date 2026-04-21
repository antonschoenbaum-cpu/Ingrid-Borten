import { formatPriceDKK } from "@/lib/format";

type Props = {
  price: number;
  sold?: boolean;
  className?: string;
  /** Større typografi på værk-detaljesider */
  size?: "card" | "detail";
};

export function SoldPrice({ price, sold, className = "", size = "card" }: Props) {
  const formatted = formatPriceDKK(price);
  const isSold = sold === true;
  const priceClass =
    size === "detail"
      ? "font-serif text-2xl text-accent"
      : "font-serif text-lg text-accent";

  if (!isSold) {
    return <span className={`${priceClass} ${className}`.trim()}>{formatted}</span>;
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`.trim()}>
      <span
        className={`${priceClass} text-ink-muted line-through decoration-ink-muted/60`.trim()}
      >
        {formatted}
      </span>
      <span className="font-sans text-sm font-medium uppercase tracking-wide text-accent">
        (SOLGT)
      </span>
    </span>
  );
}
