import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log ind",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-20 md:px-8">
      <h1 className="text-center font-serif text-3xl text-ink">Log ind</h1>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Administratoradgang til indholdsredigering.
      </p>
      <LoginForm />
    </div>
  );
}
