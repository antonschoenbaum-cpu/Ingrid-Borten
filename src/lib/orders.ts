import { getSupabaseServiceClient, type ProductType } from "@/lib/webshop";

export type OrderRow = {
  id: string;
  product_type: ProductType;
  product_id: string;
  product_title: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  customer_zip: string;
  selected_pickup_point_id: string | null;
  selected_carrier: string | null;
  stripe_session_id: string;
  status: string;
  shipmondo_shipment_id: string | null;
  tracking_number: string | null;
  label_url: string | null;
  created_at: string;
};

export async function createPaidOrder(input: {
  productType: ProductType;
  productId: string;
  productTitle: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerZip: string;
  pickupPointId: string | null;
  carrier: string | null;
  stripeSessionId: string;
}) {
  const supabase = getSupabaseServiceClient();
  const payload = {
    product_type: input.productType,
    product_id: input.productId,
    product_title: input.productTitle,
    amount: input.amount,
    currency: input.currency.toLowerCase(),
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_address: input.customerAddress,
    customer_city: input.customerCity,
    customer_zip: input.customerZip,
    selected_pickup_point_id: input.pickupPointId,
    selected_carrier: input.carrier,
    stripe_session_id: input.stripeSessionId,
    status: "paid",
  };
  const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as OrderRow;
}

export async function markProductSold(productType: ProductType, productId: string) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from(productType)
    .update({ sold: true, stock: 0 })
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OrderRow | null) ?? null;
}

export async function updateOrderShipment(
  orderId: string,
  data: { shipmondoShipmentId: string | null; trackingNumber: string | null; labelUrl: string | null; status?: string },
) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({
      shipmondo_shipment_id: data.shipmondoShipmentId,
      tracking_number: data.trackingNumber,
      label_url: data.labelUrl,
      status: data.status,
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function listOrders(): Promise<OrderRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);
}

