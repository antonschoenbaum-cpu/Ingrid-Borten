import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createPaidOrder, markProductSold, updateOrderStatus } from "@/lib/orders";
import { createShipmentForOrder } from "@/lib/shipmondo";
import { resendFromHeader } from "@/lib/resend-from";
import { incrementArtistPayoutBalances, type ProductType } from "@/lib/webshop";

export const dynamic = "force-dynamic";

function isProductType(v: string): v is ProductType {
  return v === "paintings" || v === "jewelry";
}

async function sendBuyerMail(input: {
  to: string;
  productTitle: string;
  amountDkk: number;
  pickupPointLabel: string | null;
}) {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key || !input.to) return;
  const resend = new Resend(key);
  const pickup =
    input.pickupPointLabel?.trim() ||
    "Leveres til din valgte afhentningsadresse";
  await resend.emails.send({
    from: resendFromHeader(),
    to: input.to,
    subject: "Tak for dit køb",
    html: `
      <h2>Tak for dit køb</h2>
      <p><strong>Produkt:</strong> ${input.productTitle}</p>
      <p><strong>Pris:</strong> ${input.amountDkk.toLocaleString("da-DK")} kr.</p>
      <p><strong>Pakkeshop:</strong> ${pickup}</p>
      <p>Forventet levering: 1-3 hverdage.</p>
    `,
  });
}

async function sendSellerShipmentFailureMail(input: { productTitle: string }) {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  const to = (process.env.CONTACT_EMAIL ?? "").trim();
  if (!key || !to) return;
  const resend = new Resend(key);
  await resend.emails.send({
    from: resendFromHeader(),
    to,
    subject: `OBS: Fragtlabel kunne ikke oprettes — ${input.productTitle}`,
    html: `
      <p>OBS: Betaling modtaget for <strong>${input.productTitle}</strong> men fragtlabel
      kunne ikke oprettes automatisk.</p>
      <p>Opret label manuelt i admin under <strong>Ordrer</strong>.</p>
    `,
  });
}

async function tryCreateShipmentAfterPayment(orderId: string, productTitle: string) {
  const base = (process.env.AUTH_URL ?? "").trim();
  try {
    if (base) {
      const shipRes = await fetch(`${base}/api/shipmondo/create-shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!shipRes.ok) {
        const detail = await shipRes.text().catch(() => "");
        throw new Error(`Shipmondo API ${shipRes.status}: ${detail}`);
      }
    } else {
      await createShipmentForOrder(orderId);
    }
  } catch (error) {
    console.error("[stripe webhook] Shipment creation failed for order", orderId, error);
    await updateOrderStatus(orderId, "paid_no_shipment");
    await sendSellerShipmentFailureMail({ productTitle });
  }
}

export async function POST(req: Request) {
  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook env mangler." }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Manglende stripe-signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Webhook validering fejlede";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const productTypeRaw = String(session.metadata?.product_type ?? "");
  const productId = String(session.metadata?.product_id ?? "");
  const pickupPointId = String(session.metadata?.pickup_point_id ?? "") || null;
  const carrier = String(session.metadata?.carrier ?? "") || null;
  const pickupPointLabel =
    String(session.metadata?.pickup_point_label ?? "").trim() || null;
  if (!isProductType(productTypeRaw) || !productId || !session.id) {
    return NextResponse.json({ error: "Manglende metadata i checkout session." }, { status: 400 });
  }

  try {
    const productTitle = String(
      session.metadata?.product_title ?? session.client_reference_id ?? "Værk",
    );
    const metaAddr = String(session.metadata?.customer_address ?? "").trim();
    const metaZip = String(session.metadata?.customer_zip ?? "").trim();
    const metaCity = String(session.metadata?.customer_city ?? "").trim();
    const order = await createPaidOrder({
      productType: productTypeRaw,
      productId,
      productTitle,
      amount: Number(session.amount_total ?? 0),
      currency: String(session.currency ?? "dkk"),
      customerName: String(session.customer_details?.name ?? "Kunde"),
      customerEmail: String(session.customer_details?.email ?? ""),
      customerAddress:
        metaAddr || String(session.customer_details?.address?.line1 ?? ""),
      customerCity: metaCity || String(session.customer_details?.address?.city ?? ""),
      customerZip: metaZip || String(session.customer_details?.address?.postal_code ?? ""),
      pickupPointId,
      pickupPointName: pickupPointLabel,
      carrier,
      stripeSessionId: session.id,
    });

    await markProductSold(productTypeRaw, productId);

    await incrementArtistPayoutBalances(Number(session.amount_total ?? 0));

    await sendBuyerMail({
      to: order.customer_email,
      productTitle: order.product_title,
      amountDkk: order.amount / 100,
      pickupPointLabel: order.pickup_point_name ?? pickupPointLabel,
    });

    await tryCreateShipmentAfterPayment(order.id, order.product_title);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Ukendt fejl";
    if (msg.toLowerCase().includes("duplicate key") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
