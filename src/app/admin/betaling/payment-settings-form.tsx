"use client";

import { useEffect, useState } from "react";

const STRIPE_ONBOARDING_SESSION_KEY = "stripe_connect_onboarding_complete";

type SettingsResponse = {
  paymentsEnabled: boolean;
  stripeAccountId: string | null;
  onboardingComplete: boolean;
  artistAddress: string;
  artistZip: string;
  artistCity: string;
};

type ApiError = { error?: string };

export function PaymentSettingsForm() {
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [artistAddress, setArtistAddress] = useState("");
  const [artistZip, setArtistZip] = useState("");
  const [artistCity, setArtistCity] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeOnboardingReturned, setStripeOnboardingReturned] = useState(false);
  const [togglePending, setTogglePending] = useState(false);
  const [stripeConnectPending, setStripeConnectPending] = useState(false);
  const [addressPending, setAddressPending] = useState(false);
  const [toggleMsg, setToggleMsg] = useState<string | null>(null);
  const [stripeConnectError, setStripeConnectError] = useState<string | null>(null);
  const [addressMsg, setAddressMsg] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#F5F0EB");
  const [bgColorPending, setBgColorPending] = useState(false);
  const [bgColorGeneratePending, setBgColorGeneratePending] = useState(false);
  const [bgColorMsg, setBgColorMsg] = useState<string | null>(null);
  const [bgColorError, setBgColorError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      let stripeOnboardingBadge = false;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("onboarding") === "complete") {
          sessionStorage.setItem(STRIPE_ONBOARDING_SESSION_KEY, "1");
          window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
          stripeOnboardingBadge = true;
        } else if (sessionStorage.getItem(STRIPE_ONBOARDING_SESSION_KEY) === "1") {
          stripeOnboardingBadge = true;
        }
      }

      try {
        const [settingsRes, colorRes] = await Promise.all([
          fetch("/api/admin/stripe-connect", { cache: "no-store" }),
          fetch("/api/admin/bg-color", { cache: "no-store" }),
        ]);
        if (!settingsRes.ok) {
          setStripeOnboardingReturned(stripeOnboardingBadge);
          return;
        }
        const data = (await settingsRes.json()) as SettingsResponse;
        setPaymentsEnabled(data.paymentsEnabled === true);
        setArtistAddress(data.artistAddress ?? "");
        setArtistZip(data.artistZip ?? "");
        setArtistCity(data.artistCity ?? "");
        setStripeAccountId(data.stripeAccountId ?? null);
        if (data.onboardingComplete === true) {
          sessionStorage.setItem(STRIPE_ONBOARDING_SESSION_KEY, "1");
          stripeOnboardingBadge = true;
        }
        setStripeOnboardingReturned(stripeOnboardingBadge);
        if (colorRes.ok) {
          const colorData = (await colorRes.json()) as { bgColor?: string };
          if (typeof colorData.bgColor === "string") setBgColor(colorData.bgColor);
        }
      } catch {
        setStripeOnboardingReturned(stripeOnboardingBadge);
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

  async function startStripeConnect() {
    setStripeConnectPending(true);
    setStripeConnectError(null);
    try {
      const res = await fetch("/api/admin/stripe-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectStripe: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || typeof data.url !== "string" || !data.url.length) {
        setStripeConnectError(data.error ?? "Kunne ikke starte Stripe-tilslutning.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setStripeConnectError("Kunne ikke starte Stripe-tilslutning.");
    } finally {
      setStripeConnectPending(false);
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
          <h2 className="font-serif text-xl text-ink">Udbetaling</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Tilslut din bankkonto og færdiggør verificering hos Stripe. Stripe indsamler og
            opbevarer alle bankoplysninger — vi gemmer ikke kontonummer på serveren.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-outline"
              disabled={stripeConnectPending}
              onClick={() => void startStripeConnect()}
            >
              {stripeConnectPending ? "Åbner Stripe..." : "Tilslut din bankkonto via Stripe"}
            </button>
          </div>
          {stripeOnboardingReturned ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded border border-sage-deep/40 bg-sage-deep/10 px-3 py-1.5 text-sm text-sage-deep">
              <span aria-hidden>✓</span> Betalingskonto tilknyttet
            </p>
          ) : null}
          {stripeAccountId && !stripeOnboardingReturned ? (
            <p className="mt-3 text-sm text-ink-muted">
              Du har startet tilslutning. Klik knappen igen for at fortsætte eller opdatere
              oplysninger hos Stripe.
            </p>
          ) : null}
          {stripeConnectError ? <p className="mt-3 text-sm text-rose-dust">{stripeConnectError}</p> : null}
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

