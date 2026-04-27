import { SettingsForm } from "./settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ink">Indstillinger</h1>
        <p className="mt-2 text-sm text-ink-muted">Skift adgangskode til admin-login.</p>
      </div>
      <SettingsForm />
    </div>
  );
}
