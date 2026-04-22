import { topProductRows } from "@/lib/analytics-products";
import { getJewelry, getPaintings } from "@/lib/data";
import {
  lastNDaysKeys,
  readSiteAnalytics,
  sortCounts,
} from "@/lib/analytics-store";

function formatDaDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

export async function AdminAnalyticsSummary() {
  const [a, paintings, jewelry] = await Promise.all([
    readSiteAnalytics(),
    getPaintings(),
    getJewelry(),
  ]);
  const titleByPath = new Map<string, string>();
  for (const p of paintings) titleByPath.set(`/malerier/${p.id}`, p.title);
  for (const j of jewelry) titleByPath.set(`/smykker/${j.id}`, j.title);

  const topPaintings = topProductRows(a, "malerier", 10);
  const topJewelry = topProductRows(a, "smykker", 10);

  const topPaths = sortCounts(a.byPath, 10);
  const topClicks = sortCounts(a.clicksByTarget, 10);
  const dayKeys = lastNDaysKeys(7);
  const pv7 = dayKeys.reduce((s, k) => s + (a.byDay[k]?.pageViews ?? 0), 0);
  const cl7 = dayKeys.reduce((s, k) => s + (a.byDay[k]?.clicks ?? 0), 0);
  const maxBar = Math.max(
    1,
    ...dayKeys.map((k) => a.byDay[k]?.pageViews ?? 0),
  );

  return (
    <section className="section-rule mt-14 border-dashed pt-14">
      <h2 className="font-serif text-xl text-ink">Besøg og klik (førsteparts)</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
        Tal samles på din egen server i <code className="text-xs">data/analytics.json</code> — uden
        Google Analytics eller andre eksterne værktøjer. Det er{" "}
        <span className="font-medium text-ink/80">sidevisninger og klik på jeres egne sider</span>, ikke
        unikke personer. Der gemmes{" "}
        <span className="font-medium text-ink/80">ikke hvem</span> besøgende er, og{" "}
        <span className="font-medium text-ink/80">ikke land eller by</span> — kun stitaller.
        På serverless hosting (fx Vercel) skal der være skrivbar persistent disk, ellers nulstilles tallene
        ved deploy.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-secondary/50 bg-paper-warm/50 p-4">
          <p className="text-xs uppercase tracking-wider text-ink-muted">Sidevisninger i alt</p>
          <p className="mt-1 font-serif text-3xl text-ink">{a.totalPageViews.toLocaleString("da-DK")}</p>
        </div>
        <div className="border border-secondary/50 bg-paper-warm/50 p-4">
          <p className="text-xs uppercase tracking-wider text-ink-muted">Interne klik i alt</p>
          <p className="mt-1 font-serif text-3xl text-ink">{a.totalClicks.toLocaleString("da-DK")}</p>
        </div>
        <div className="border border-secondary/50 bg-paper-warm/50 p-4">
          <p className="text-xs uppercase tracking-wider text-ink-muted">Seneste 7 dage</p>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-serif text-2xl text-ink">{pv7.toLocaleString("da-DK")}</span> visninger
            <br />
            <span className="font-serif text-2xl text-ink">{cl7.toLocaleString("da-DK")}</span> klik
          </p>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-xs uppercase tracking-wider text-ink-muted">Sidevisninger pr. dag (7 dage)</p>
        <div className="mt-3 flex h-32 items-end gap-1.5 border-b border-secondary/40 pb-1">
          {dayKeys.map((k) => {
            const v = a.byDay[k]?.pageViews ?? 0;
            const px = Math.round((v / maxBar) * 104);
            return (
              <div key={k} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full max-w-[2.5rem] rounded-t bg-accent/70"
                  style={{ height: `${Math.max(v > 0 ? 6 : 2, px)}px` }}
                  title={`${formatDaDate(k)}: ${v}`}
                />
                <span className="text-[10px] text-ink-muted">{k.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="font-serif text-lg text-ink">Mest besøgte sider</h3>
          {topPaths.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Ingen data endnu — besøg den offentlige side et par gange.</p>
          ) : (
            <ol className="mt-4 space-y-2 text-sm">
              {topPaths.map(([path, n], i) => (
                <li
                  key={path}
                  className="flex justify-between gap-4 border-b border-secondary/30 py-2 last:border-0"
                >
                  <span className="text-ink-muted">
                    <span className="mr-2 font-mono text-xs text-accent">{i + 1}.</span>
                    <code className="text-ink">{path}</code>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{n.toLocaleString("da-DK")}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3 className="font-serif text-lg text-ink">Mest klikkede mål</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Hvor brugerne navigerer hen via menulinje, kort og tekstlinks (kun interne stier).
          </p>
          {topClicks.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Ingen klik registreret endnu.</p>
          ) : (
            <ol className="mt-4 space-y-2 text-sm">
              {topClicks.map(([path, n], i) => (
                <li
                  key={path}
                  className="flex justify-between gap-4 border-b border-secondary/30 py-2 last:border-0"
                >
                  <span className="text-ink-muted">
                    <span className="mr-2 font-mono text-xs text-accent">{i + 1}.</span>
                    <code className="text-ink">{path}</code>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{n.toLocaleString("da-DK")}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-14">
        <h3 className="font-serif text-lg text-ink">Mest sete produkter</h3>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink/80">Visninger</span> = hvor mange gange en værkside er
          åbnet. <span className="font-medium text-ink/80">Klik hertil</span> = hvor mange gange nogen har
          klikket et internt link på hjemmesiden, der går til netop den side (fx fra oversigt eller
          forsiden). Direkte besøg fra bogmærke eller søgemaskine tæller som visning, men ikke som klik.
        </p>
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <ProductTopTable
            title="Malerier"
            rows={topPaintings}
            titleByPath={titleByPath}
            emptyHint="Ingen visninger af malerisider endnu."
          />
          <ProductTopTable
            title="Smykker"
            rows={topJewelry}
            titleByPath={titleByPath}
            emptyHint="Ingen visninger af smykkesider endnu."
          />
        </div>
      </div>
    </section>
  );
}

function ProductTopTable({
  title,
  rows,
  titleByPath,
  emptyHint,
}: {
  title: string;
  rows: { path: string; id: string; views: number; clicks: number }[];
  titleByPath: Map<string, string>;
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h4 className="font-serif text-base text-ink">{title}</h4>
        <p className="mt-2 text-sm text-ink-muted">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-serif text-base text-ink">{title}</h4>
      <div className="mt-3 overflow-x-auto rounded border border-secondary/40">
        <table className="w-full min-w-[280px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-secondary/50 bg-paper-warm/60 text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Titel</th>
              <th className="px-3 py-2 text-right font-medium">Visninger</th>
              <th className="px-3 py-2 text-right font-medium">Klik hertil</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const t = titleByPath.get(row.path) ?? row.id;
              return (
                <tr key={row.path} className="border-b border-secondary/30 last:border-0">
                  <td className="px-3 py-2.5 tabular-nums text-ink-muted">{i + 1}</td>
                  <td className="max-w-[200px] px-3 py-2.5">
                    <span className="text-ink">{t}</span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-muted">
                      {row.path}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                    {row.views.toLocaleString("da-DK")}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                    {row.clicks.toLocaleString("da-DK")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
