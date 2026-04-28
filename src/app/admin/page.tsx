import { UploadWidget } from "./upload-widget";
import { getJewelry, getPaintings } from "@/lib/data";
import { listOrders } from "@/lib/orders";

export default async function AdminHomePage() {
  const artistName = (process.env.ARTIST_NAME ?? "kunstner").trim() || "kunstner";

  const [paintings, jewelry, pendingOrdersCount] = await Promise.all([
    getPaintings().catch(() => []),
    getJewelry().catch(() => []),
    listOrders()
      .then((orders) => orders.filter((o) => o.status === "paid").length)
      .catch(() => 0),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">{`God dag, ${artistName}`}</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-muted">
        Her er et hurtigt overblik over din side.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <article className="rounded border border-secondary/50 bg-paper-warm/40 p-5">
          <p className="text-sm text-ink-muted">Malerier</p>
          <p className="mt-2 font-serif text-3xl text-ink">{paintings.length}</p>
        </article>
        <article className="rounded border border-secondary/50 bg-paper-warm/40 p-5">
          <p className="text-sm text-ink-muted">Smykker</p>
          <p className="mt-2 font-serif text-3xl text-ink">{jewelry.length}</p>
        </article>
        <article className="rounded border border-secondary/50 bg-paper-warm/40 p-5">
          <p className="text-sm text-ink-muted">Ordrer (ubehandlede)</p>
          <p className="mt-2 font-serif text-3xl text-ink">{pendingOrdersCount}</p>
        </article>
      </div>

      <section className="section-rule mt-16 border-dashed pt-16">
        <h2 className="font-serif text-xl text-ink">Hurtig upload</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Vælg mappe og fil. Stien vises efter upload — indsæt den i maleri-, smykke- eller
          begivenhedsformularen, eller under Om kunstneren.
        </p>
        <UploadWidget />
      </section>
    </div>
  );
}
