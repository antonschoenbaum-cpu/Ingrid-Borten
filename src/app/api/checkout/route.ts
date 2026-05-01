import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { readArtistSettings, readProductById, type ProductType } from "@/lib/webshop";

type Body = {
  product_type?: unknown;
  product_id?: unknown;
  pickup_point_id?: unknown;
  pickup_point_name?: unknown;
  pickup_point_address?: unknown;
  carrier?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isProductType(v: string): v is ProductType {
  return v === "paintings" || v === "jewelry";
}

/** Stripe metadata values max 500 tegn — hold margin. */
function stripeMetaValue(s: string): string {
  const t = s.trim();
  if (t.length <= 480) return t;
  return `${t.slice(0, 479)}…`;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const productTypeRaw = asString(body.product_type);
  const productId = asString(body.product_id);
  const pickupPointId = asString(body.pickup_point_id);
  const pickupPointName = asString(body.pickup_point_name);
  const pickupPointAddress = asString(body.pickup_point_address);
  const carrier = asString(body.carrier);
  const pickupPointLabel =
    pickupPointName || pickupPointAddress
      ? stripeMetaValue(
          [pickupPointName, pickupPointAddress].filter((x) => x.length > 0).join(" — "),
        )
      : "";
  if (!isProductType(productTypeRaw) || !productId) {
    return NextResponse.json({ error: "Manglende produktdata." }, { status: 400 });
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!stripeKey) return NextResponse.json({ error: "STRIPE_SECRET_KEY mangler." }, { status: 500 });
  const stripe = new Stripe(stripeKey);

  const [product, artistSettings] = await Promise.all([
    readProductById(productTypeRaw, productId),
    readArtistSettings(false),
  ]);
  if (!product) return NextResponse.json({ error: "Produkt ikke fundet." }, { status: 404 });
  if (product.sold || product.stock <= 0) {
    return NextResponse.json({ error: "Produktet er ikke tilgængeligt." }, { status: 400 });
  }
  if (!artistSettings.paymentsEnabled) {
    return NextResponse.json({ error: "Betaling er ikke aktiv." }, { status: 400 });
  }

  const origin =
    (process.env.AUTH_URL ?? "").trim() ||
    req.headers.get("origin") ||
    req.nextUrl.origin;
  const unitAmount = Math.round(product.price * 100);
  const sessionPayload: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "dkk",
          unit_amount: unitAmount,
          product_data: {
            name: product.title,
            description: product.description?.slice(0, 500),
            images: product.image ? [product.image] : undefined,
          },
        },
      },
    ],
    success_url: `${origin}/tak?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${productTypeRaw}/${productId}`,
    shipping_address_collection: { allowed_countries: ["DK"] },
    metadata: {
      product_type: productTypeRaw,
      product_id: productId,
      product_title: product.title,
      pickup_point_id: pickupPointId,
      ...(pickupPointLabel ? { pickup_point_label: pickupPointLabel } : {}),
      carrier,
      checkout_mode: "platform",
    },
  };

  const session = await stripe.checkout.sessions.create(sessionPayload);

  return NextResponse.json({ url: session.url });
}

