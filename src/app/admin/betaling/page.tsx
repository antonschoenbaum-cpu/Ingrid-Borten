import { PaymentSettingsForm } from "./payment-settings-form";

export default function AdminPaymentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ink">Betaling</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sæt betaling op og styr, om køb er aktive på hjemmesiden.
        </p>
      </div>
      <PaymentSettingsForm />
    </div>
  );
}

