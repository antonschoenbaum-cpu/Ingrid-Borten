"use client";

import { useEffect, useState } from "react";

type SettingsResponse = {
  paymentsEnabled: boolean;
  stripeAccountId: string | null;
  bankRegNumber: string;
  bankAccountNumber: string;
  artistAddress: string;
  artistZip: string;
  artistCity: string;
};

type ApiError = { error?: string };

export function PaymentSettingsForm() {
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [artistAddress, setArtistAddress] = useState("");
  const [artistZip, setArtistZip] = useState("");
  const [artistCity, setArtistCity] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [togglePending, setTogglePending] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [addressPending, setAddressPending] = useState(false);
  const [toggleMsg, setToggleMsg] = useState<string | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [addressMsg, setAddressMsg] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stripe-connect", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SettingsResponse;
        setPaymentsEnabled(data.paymentsEnabled === true);
        setRegNumber(data.bankRegNumber ?? "");
        setAccountNumber(data.bankAccountNumber ?? "");
        setArtistAddress(data.artistAddress ?? "");
        setArtistZip(data.artistZip ?? "");
        setArtistCity(data.artistCity ?? "");
        setStripeAccountId(data.stripeAccountId ?? null);
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
      const res = await fetch("/api/admin/stripe-connect", {
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

  async function saveBank(e: React.FormEvent) {
    e.preventDefault();
    setPaymentPending(true);
    setPaymentError(null);
    setPaymentMsg(null);
    try {
      const res = await fetch("/api/admin/stripe-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNumber, accountNumber }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        stripeAccountId?: string | null;
      };
      if (!res.ok) {
        setPaymentError(data.error ?? "Kunne ikke gemme bankoplysninger.");
        return;
      }
      setStripeAccountId(data.stripeAccountId ?? null);
      setPaymentMsg("Bankoplysninger er gemt.");
    } catch {
      setPaymentError("Kunne ikke gemme bankoplysninger.");
    } finally {
      setPaymentPending(false);
    }
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressPending(true);
    setAddressError(null);
    setAddressMsg(null);
    try {
      const res = await fetch("/api/admin/stripe-connect", {
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
        <section className="rounded border border-secondary/50 bg-paper-warm/40 p-6">
          <h2 className="font-serif text-xl text-ink">Bankoplysninger</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Indtast dine bankoplysninger så vi kan sende pengene direkte til din konto. Dine
            oplysninger gemmes sikkert og bruges kun til at udbetale dine salg.
          </p>
          <form onSubmit={saveBank} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-sm text-ink-muted">
              Registreringsnummer
              <input
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
                placeholder="1234"
                maxLength={4}
                required
              />
              <span className="mt-1 block text-xs text-ink-muted/90">
                De første 4 cifre på dit kontonummer
              </span>
            </label>
            <label className="block text-sm text-ink-muted">
              Kontonummer
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                className="mt-1 w-full border border-secondary/60 bg-paper px-3 py-2 text-sm text-ink"
                placeholder="12345678"
                maxLength={10}
                required
              />
              <span className="mt-1 block text-xs text-ink-muted/90">
                Findes på din netbank eller kontoudtog
              </span>
            </label>
            <button type="submit" className="btn-outline h-10" disabled={paymentPending}>
              {paymentPending ? "Gemmer..." : "Gem"}
            </button>
          </form>
          {stripeAccountId ? (
            <p className="mt-3 text-xs text-ink-muted">Stripe konto: {stripeAccountId}</p>
          ) : null}
          {paymentMsg ? <p className="mt-3 text-sm text-accent">{paymentMsg}</p> : null}
          {paymentError ? <p className="mt-3 text-sm text-rose-dust">{paymentError}</p> : null}
        </section>
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
    </div>
  );
}

