import { Resend } from "resend";
import { getOrderById, updateOrderShipment } from "@/lib/orders";
import { readArtistSettings } from "@/lib/webshop";

function productCodeFromCarrier(carrier: string | null): string {
  const c = (carrier ?? "").toLowerCase();
  if (c.includes("postnord")) return "PDK";
  if (c.includes("dao")) return "DAO";
  return "PGPS";
}

async function sendSellerMail(input: {
  toEmail: string;
  productTitle: string;
  amountDkk: number;
  customerName: string;
  address: string;
  cityZip: string;
  pickupPointId: string | null;
  labelUrl: string | null;
}) {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) return;
  const resend = new Resend(key);
  await resend.emails.send({
    from: "Salg <onboarding@resend.dev>",
    to: input.toEmail,
    subject: `Du har solgt: ${input.productTitle} 🎉`,
    html: `
      <h2>Du har solgt et værk</h2>
      <p><strong>Produkt:</strong> ${input.productTitle}</p>
      <p><strong>Pris:</strong> ${input.amountDkk.toLocaleString("da-DK")} kr.</p>
      <p><strong>Køber:</strong> ${input.customerName}</p>
      <p><strong>Leveringsadresse:</strong> ${input.address}, ${input.cityZip}</p>
      <p><strong>Valgt pakkeshop:</strong> ${input.pickupPointId ?? "Ikke angivet"}</p>
      ${
        input.labelUrl
          ? `<p><a href="${input.labelUrl}" style="font-size:18px;font-weight:bold">Hent din fragtlabel</a></p>`
          : ""
      }
      <p>Print labelen, pak varen og scan QR-koden i din nærmeste pakkeshop.</p>
    `,
  });
}

export async function createShipmentForOrder(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) throw new Error("Ordre ikke fundet.");

  const settings = await readArtistSettings(true);
  const user = (settings.shipmondoApiUser || process.env.SHIPMONDO_API_USER || "").trim();
  const key = (settings.shipmondoApiKey || process.env.SHIPMONDO_API_KEY || "").trim();
  if (!user || !key) throw new Error("Shipmondo credentials mangler.");
  if (!settings.artistAddress || !settings.artistZip || !settings.artistCity) {
    throw new Error("Afsenderadresse mangler i betalingopsætning.");
  }

  const body = {
    own_agreement: false,
    label_format: "pdf",
    product_code: productCodeFromCarrier(order.selected_carrier),
    sender: {
      name: (process.env.ARTIST_NAME ?? "Kunstner").trim() || "Kunstner",
      address: settings.artistAddress,
      zipcode: settings.artistZip,
      city: settings.artistCity,
      country_code: "DK",
    },
    receiver: {
      name: order.customer_name,
      address: order.customer_address,
      zipcode: order.customer_zip,
      city: order.customer_city,
      country_code: "DK",
    },
    parcels: [{ weight: 1000 }],
    pickup_point: order.selected_pickup_point_id
      ? { id: order.selected_pickup_point_id }
      : undefined,
  };

  const auth = Buffer.from(`${user}:${key}`).toString("base64");
  const res = await fetch("https://app.shipmondo.com/api/public/v3/shipments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Shipmondo fejl (${res.status}): ${JSON.stringify(json)}`);
  }

  const shipmentId = String(json.id ?? "");
  const tracking = String((json as { tracking_number?: unknown }).tracking_number ?? "");
  const labelUrl = String(
    (json as { label_url?: unknown; label?: { url?: unknown } }).label_url ??
      (json as { label?: { url?: unknown } }).label?.url ??
      "",
  );

  await updateOrderShipment(order.id, {
    shipmondoShipmentId: shipmentId || null,
    trackingNumber: tracking || null,
    labelUrl: labelUrl || null,
    status: "shipped",
  });

  const sellerEmail = (process.env.CONTACT_EMAIL ?? "").trim();
  if (sellerEmail) {
    await sendSellerMail({
      toEmail: sellerEmail,
      productTitle: order.product_title,
      amountDkk: order.amount / 100,
      customerName: order.customer_name,
      address: order.customer_address,
      cityZip: `${order.customer_zip} ${order.customer_city}`,
      pickupPointId: order.selected_pickup_point_id,
      labelUrl: labelUrl || null,
    });
  }

  return { shipmentId, trackingNumber: tracking, labelUrl };
}

