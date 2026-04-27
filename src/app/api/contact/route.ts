import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const toEmail = (process.env.CONTACT_EMAIL ?? "").trim();

  if (!apiKey || !toEmail) {
    return NextResponse.json({ error: "Kontakt er ikke konfigureret." }, { status: 500 });
  }

  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email);
  const message = asTrimmedString(body.message);

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Alle felter skal udfyldes." }, { status: 400 });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: "Kontaktformular <onboarding@resend.dev>",
      to: toEmail,
      replyTo: email,
      subject: "Ny besked fra kontaktformular",
      text: `Navn: ${name}\nE-mail: ${email}\n\nBesked:\n${message}`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kunne ikke sende besked." }, { status: 500 });
  }
}
