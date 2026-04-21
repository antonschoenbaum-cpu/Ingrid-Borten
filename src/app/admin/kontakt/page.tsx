import { ContactLinksEditor } from "./contact-links-editor";
import { getContactLinks } from "@/lib/data";

export default async function AdminContactPage() {
  const links = await getContactLinks();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Kontakt — sociale medier</h1>
      <p className="mt-3 text-sm text-ink-muted">
        Her styrer du, hvilke adresser der åbnes, når besøgende trykker på Facebook- og
        Instagram-ikonerne under kontaktsiden.
      </p>
      <div className="mt-10 max-w-xl">
        <ContactLinksEditor initial={links} />
      </div>
    </div>
  );
}
