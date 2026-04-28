import Link from "next/link";
import { notFound } from "next/navigation";
import { readArtistSettings, readProductById, type ProductType } from "@/lib/webshop";
import { CheckoutClient } from "./checkout-client";

type Props = { params: Promise<{ product_type: string; product_id: string }> };

function isProductType(v: string): v is ProductType {
  return v === "paintings" || v === "jewelry";
}

export default async function CheckoutPage({ params }: Props) {
  const { product_type, product_id } = await params;
  if (!isProductType(product_type)) notFound();

  const [product, settings] = await Promise.all([
    readProductById(product_type, product_id),
    readArtistSettings(false),
  ]);
  if (!product) notFound();
  if (!settings.paymentsEnabled || product.sold || product.stock <= 0) {
    notFound();
  }

  const backHref = `/${product_type}/${product_id}`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-20">
      <Link href={backHref} className="text-sm uppercase tracking-wider text-ink-muted hover:text-ink">
        ← Tilbage til værket
      </Link>

      <header className="section-rule mt-8 pb-8 pt-8">
        <h1 className="font-serif text-3xl text-ink md:text-4xl">Checkout</h1>
        <p className="mt-2 text-ink-muted">{product.title}</p>
        <p className="mt-1 font-serif text-xl text-accent">{product.price.toLocaleString("da-DK")} kr.</p>
      </header>

      <div className="mt-8">
        <CheckoutClient productType={product_type} productId={product_id} />
      </div>
    </div>
  );
}

