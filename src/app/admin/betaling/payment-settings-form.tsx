"use client";

import { useEffect, useState } from "react";

type SettingsResponse = {
  paymentsEnabled: boolean;
  pendingPayoutOre: number;
  totalEarnedOre: number;
  payoutMobile: string;
  artistAddress: string;
  artistZip: string;
  artistCity: string;
};

type ApiError = { error?: string };

function formatOreAsDkk(ore: number): string {
  if (!Number.isFinite(ore)) return "0";
  return (ore / 100).toLocaleString("da-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function PaymentSettingsForm() {
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [pendingPayoutOre, setPendingPayoutOre] = useState(0);
  const [totalEarnedOre, setTotalEarnedOre] = useState(0);
  const [payoutMobile, setPayoutMobile] = useState("");
  const [artistAddress, setArtistAddress] = useState("");
  const [artistZip, setArtistZip] = useState("");
  const [artistCity, setArtistCity] = useState("");
  const [togglePending, setTogglePending] = useState(false);
  const [mobilePending, setMobilePending] = useState(false);
  const [payoutRequestPending, setPayoutRequestPending] = useState(false);
  const [addressPending, setAddressPending] = useState(false);
  const [toggleMsg, setToggleMsg] = useState<string | null>(null);
  const [mobileMsg, setMobileMsg] = useState<string | null>(null);
  const [payoutRequestMsg, setPayoutRequestMsg] = useState<string | null>(null);
  const [addressMsg, setAddressMsg] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#F5F0EB");
  const [bgColorPending, setBgColorPending] = useState(false);
  const [bgColorGeneratePending, setBgColorGeneratePending] = useState(false);
  const [bgColorMsg, setBgColorMsg] = useState<string | null>(null);
  const [bgColorError, setBgColorError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [payoutRequestError, setPayoutRequestError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, colorRes] = await Promise.all([
          fetch("/api/admin/payment-settings", { cache: "no-store" }),
          fetch("/api/admin/bg-color", { cache: "no-store" }),
        ]);
        if (!settingsRes.ok) return;
        const data = (await settingsRes.json()) as SettingsResponse;
        setPaymentsEnabled(data.paymentsEnabled === true);
        setPendingPayoutOre(Number(data.pendingPayoutOre ?? 0));
        setTotalEarnedOre(Number(data.totalEarnedOre ?? 0));
        setPayoutMobile(data.payoutMobile ?? "");
        setArtistAddress(data.artistAddress ?? "");
        setArtistZip(data.artistZip ?? "");
        setArtistCity(data.artistCity ?? "");
        if (colorRes.ok) {
          const colorData = (await colorRes.json()) as { bgColor?: string };
          if (typeof colorData.bgColor === "string") setBgColor(colorData.bgColor);
        }
      } catch {
        // Ignoreres i UI.
      }
    }
    void load();
  }, []);

  async function saveToggle(nextValue: boolean) {
    setTogglePending(true);
    setToggleError(null);
    setToggleMsg(null);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentsEnabled: nextValue }),
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setToggleError(data.error ?? "Kunne ikke opdatere betalingsstatus.");
        return;
      }
      setPaymentsEnabled(nextValue);
      setToggleMsg(nextValue ? "Betaling er slået til." : "Betaling er slået fra.");
    } catch {
      setToggleError("Kunne ikke opdatere betalingsstatus.");
    } finally {
      setTogglePending(false);
    }
  }

  async function saveMobilePay(e: React.FormEvent) {
    e.preventDefault();
    setMobilePending(true);
    setMobileError(null);
    setMobileMsg(null);
    const digits = payoutMobile.replace(/\D/g, "").slice(0, 8);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutMobile: digits }),
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setMobileError(data.error ?? "Kunne ikke gemme MobilePay-nummer.");
        return;
      }
      setPayoutMobile(digits);
      setMobileMsg("MobilePay-nummer gemt.");
    } catch {
      setMobileError("Kunne ikke gemme MobilePay-nummer.");
    } finally {
      setMobilePending(false);
    }
  }

  async function requestPayout() {
    setPayoutRequestPending(true);
    setPayoutRequestError(null);
    setPayoutRequestMsg(null);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestPayout: true }),
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setPayoutRequestError(data.error ?? "Kunne ikke anmode om udbetaling.");
        return;
      }
      setPendingPayoutOre(0);
      setPayoutRequestMsg("Anmodning sendt. Du hører fra os ved udbetaling.");
    } catch {
      setPayoutRequestError("Kunne ikke anmode om udbetaling.");
    } finally {
      setPayoutRequestPending(false);
    }
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressPending(true);
    setAddressError(null);
    setAddressMsg(null);
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistAddress, artistZip, artistCity }),
      });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if (!res.ok) {
        setAddressError(data.error ?? "Kunne ikke gemme afsenderadresse.");
        return;
      }
      setAddressMsg("Afsenderadresse er gemt.");
    } catch {
      setAddressError("Kunne ikke gemme afsenderadresse.");
    } finally {
      setAddressPending(false);
    }
  }

  async function saveBgColor() {
    setBgColorPending(true);
    setBgColorMsg(null);
    setBgColorError(null);
    try {
      const res = await fetch("/api/admin/bg-color", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bgColor }),
      });
      const data = (await res.json().catch(() => ({}))) as { bgColor?: string; error?: string };
      if (!res.ok) {
        setBgColorError(data.error ?? "Kunne ikke gemme baggrundsfarve.");
        return;
      }
      if (typeof data.bgColor === "string") setBgColor(data.bgColor);
      setBgColorMsg("Baggrundsfarve gemt.");
    } catch {
      setBgColorError("Kunne ikke gemme baggrundsfarve.");
    } finally {
      setBgColorPending(false);
    }
  }

  async function generateBgColor() {
    setBgColorGeneratePending(true);
    setBgColorMsg(null);
    setBgColorError(null);
    try {
      const res = await fetch("/api/admin/bg-color/generate", {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as { bgColor?: string; error?: string };
      if (!res.ok) {
        setBgColorError(data.error ?? "Kunne ikke generere baggrundsfarve.");
        return;
      }
      if (typeof data.bgColor === "string") setBgColor(data.bgColor);
      setBgColorMsg("AI valgte en ny baggrundsfarve.");
    } catch {
      setBgColorError("Kunne ikke generere baggrundsfarve.");
    } finally {
      setBgColorGeneratePending(false);
    }
  }

  const canRequestPayout = pendingPayoutOre > 0 && payoutMobile.replace(/\D/g, "").length === 8;

  return (
    <div className="space-y-8">
      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">Aktivér betaling</h2>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Modtag betaling på din hjemmeside</p>
            <p className="mt-1 text-sm text-ink-muted">
              Slå til for at lade besøgende købe dine værker direkte på din side. Du kan slå det
              fra igen når som helst.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={paymentsEnabled}
            disabled={togglePending}
            onClick={() => void saveToggle(!paymentsEnabled)}
            className={[
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
              paymentsEnabled
                ? "border-accent/70 bg-accent/40"
                : "border-secondary/80 bg-paper",
            ].join(" ")}
          >
            <span
              className={[
                "absolute size-5 rounded-full bg-ink transition",
                paymentsEnabled ? "right-1" : "left-1",
              ].join(" ")}
            />
          </button>
        </div>
        {toggleMsg ? <p className="mt-3 text-sm text-accent">{toggleMsg}</p> : null}
        {toggleError ? <p className="mt-3 text-sm text-rose-dust">{toggleError}</p> : null}
      </section>

      {paymentsEnabled ? (
        <>
          <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
            <h2 className="font-serif text-xl text-ink">MobilePay-nummer</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Indtast dit MobilePay-nummer så vi kan sende dig pengene når du har solgt noget.
            </p>
            <form onSubmit={saveMobilePay} className="mt-6 flex flex-wrap items-end gap-4">
              <label className="block min-w-[12rem] text-sm text-ink-muted">
                Telefonnummer (8 cifre)
                <input
                  value={payoutMobile}
                  onChange={(e) => setPayoutMobile(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  inputMode="numeric"
                  className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
                  placeholder="12345678"
                  maxLength={8}
                  autoComplete="tel-national"
                />
              </label>
              <button type="submit" className="btn-outline h-10" disabled={mobilePending}>
                {mobilePending ? "Gemmer..." : "Gem"}
              </button>
            </form>
            {mobileMsg ? <p className="mt-3 text-sm text-accent">{mobileMsg}</p> : null}
            {mobileError ? <p className="mt-3 text-sm text-rose-dust">{mobileError}</p> : null}
          </section>

          <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
            <h2 className="font-serif text-xl text-ink">Din saldo</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink">
              <li>
                <span className="text-ink-muted">Afventende udbetaling:</span>{" "}
                <strong>{formatOreAsDkk(pendingPayoutOre)} kr.</strong>
              </li>
              <li>
                <span className="text-ink-muted">Samlet tjent:</span>{" "}
                <strong>{formatOreAsDkk(totalEarnedOre)} kr.</strong>
              </li>
            </ul>
          </section>

          <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
            <h2 className="font-serif text-xl text-ink">Anmod om udbetaling</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Vi sender en mail til butikken med dit MobilePay-nummer og beløbet. Afventende saldo
              nulstilles når du har sendt anmodningen.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="btn-outline"
                disabled={payoutRequestPending || !canRequestPayout}
                onClick={() => void requestPayout()}
              >
                {payoutRequestPending ? "Sender..." : "Anmod om udbetaling"}
              </button>
            </div>
            {!canRequestPayout && pendingPayoutOre > 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                Gem et gyldigt 8-cifret MobilePay-nummer ovenfor for at kunne anmode.
              </p>
            ) : null}
            {payoutRequestMsg ? <p className="mt-3 text-sm text-accent">{payoutRequestMsg}</p> : null}
            {payoutRequestError ? (
              <p className="mt-3 text-sm text-rose-dust">{payoutRequestError}</p>
            ) : null}
          </section>
        </>
      ) : null}

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">Afsenderadresse</h2>
        <form onSubmit={saveAddress} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-ink-muted md:col-span-2">
            Vejnavn og nummer
            <input
              value={artistAddress}
              onChange={(e) => setArtistAddress(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              required
            />
          </label>
          <label className="block text-sm text-ink-muted">
            Postnummer
            <input
              value={artistZip}
              onChange={(e) => setArtistZip(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              required
            />
          </label>
          <label className="block text-sm text-ink-muted">
            By
            <input
              value={artistCity}
              onChange={(e) => setArtistCity(e.target.value)}
              className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
              required
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn-outline" disabled={addressPending}>
              {addressPending ? "Gemmer..." : "Gem"}
            </button>
          </div>
        </form>
        {addressMsg ? <p className="mt-3 text-sm text-accent">{addressMsg}</p> : null}
        {addressError ? <p className="mt-3 text-sm text-rose-dust">{addressError}</p> : null}
      </section>

      <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
        <h2 className="font-serif text-xl text-ink">Baggrundsfarve</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Din sides baggrundsfarve vælges automatisk ud fra dine værker. Du kan også vælge selv.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <span
            className="inline-block size-10 rounded border border-secondary/70"
            style={{ backgroundColor: bgColor }}
            aria-hidden
          />
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-secondary/60 bg-paper p-1"
            aria-label="Vælg baggrundsfarve"
          />
          <span className="text-sm text-ink-muted">{bgColor.toUpperCase()}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-outline"
            onClick={() => void saveBgColor()}
            disabled={bgColorPending}
          >
            {bgColorPending ? "Gemmer..." : "Gem min farve"}
          </button>
          <button
            type="button"
            className="btn-outline-dark"
            onClick={() => void generateBgColor()}
            disabled={bgColorGeneratePending}
          >
            {bgColorGeneratePending ? "Analyserer..." : "Lad AI vælge"}
          </button>
        </div>
        {bgColorMsg ? <p className="mt-3 text-sm text-accent">{bgColorMsg}</p> : null}
        {bgColorError ? <p className="mt-3 text-sm text-rose-dust">{bgColorError}</p> : null}
      </section>
    </div>
  );
}
