#!/usr/bin/env bash
set -euo pipefail

echo "ADVARSEL:"
echo "Dette script opretter en NY kundemappe."
echo "Det ændrer ALDRIG filer i det nuværende projekt."
echo

TARGET_DIR=""

cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 && -n "$TARGET_DIR" && -d "$TARGET_DIR" ]]; then
    echo
    echo "Fejl opstod — sletter delvist oprettet mappe: $TARGET_DIR"
    rm -rf "$TARGET_DIR"
    echo "Oprydning fuldført."
  fi
}
trap cleanup EXIT

read -r -p "Kundens fulde navn (fx \"Maria Hansen\"): " CUSTOMER_NAME
read -r -p "Kunstnertype (maler/fotograf/smykker/andet): " ART_TYPE
read -r -p "Email: " CUSTOMER_EMAIL
read -r -p "Ønsket subdomæne (fx \"maria-hansen\"): " SUBDOMAIN

if [[ -z "${CUSTOMER_NAME// }" || -z "${ART_TYPE// }" || -z "${CUSTOMER_EMAIL// }" || -z "${SUBDOMAIN// }" ]]; then
  echo "Fejl: Alle felter skal udfyldes."
  exit 1
fi

if ! [[ "$SUBDOMAIN" =~ ^[a-z0-9-]+$ ]]; then
  echo "Fejl: Subdomæne må kun indeholde små bogstaver, tal og bindestreg."
  exit 1
fi

TARGET_ROOT="$HOME/simplysell-customers"
TARGET_DIR="$TARGET_ROOT/$SUBDOMAIN"

mkdir -p "$TARGET_ROOT"

if [[ -e "$TARGET_DIR" ]]; then
  echo "Fejl: Mappen findes allerede: $TARGET_DIR"
  exit 1
fi

REPO_URL="${REPO_URL:-$(git config --get remote.origin.url || true)}"
if [[ -z "$REPO_URL" ]]; then
  echo "Fejl: Kunne ikke finde git remote URL."
  echo "Sæt REPO_URL manuelt, fx:"
  echo "REPO_URL=https://github.com/ORG/REPO.git ./scripts/new-customer.sh"
  exit 1
fi

echo
echo "Kloner kodebase til: $TARGET_DIR"
git clone "$REPO_URL" "$TARGET_DIR"

if [[ ! -f "$TARGET_DIR/.env.example" ]]; then
  echo "Fejl: .env.example mangler i den klonede mappe."
  exit 1
fi

cp "$TARGET_DIR/.env.example" "$TARGET_DIR/.env.local"

python3 - "$TARGET_DIR/.env.local" "$CUSTOMER_NAME" "$CUSTOMER_EMAIL" <<'PY'
import pathlib
import re
import sys

env_path = pathlib.Path(sys.argv[1])
artist_name = sys.argv[2]
customer_email = sys.argv[3]
text = env_path.read_text(encoding="utf-8")

def upsert(line_key: str, value: str, src: str) -> str:
    pattern = re.compile(rf"^{re.escape(line_key)}=.*$", re.MULTILINE)
    replacement = f"{line_key}={value}"
    if pattern.search(src):
        return pattern.sub(replacement, src)
    if not src.endswith("\n"):
        src += "\n"
    return src + replacement + "\n"

text = upsert("ARTIST_NAME", artist_name, text)
text = upsert("CONTACT_EMAIL", customer_email, text)
env_path.write_text(text, encoding="utf-8")
PY

echo
echo "Færdig! Ny kundemappe oprettet:"
echo "  $TARGET_DIR"
echo
echo "Kundeoplysninger:"
echo "  Navn:       $CUSTOMER_NAME"
echo "  Kunsttype:  $ART_TYPE"
echo "  Email:      $CUSTOMER_EMAIL"
echo "  Subdomæne:  $SUBDOMAIN.simplysell.dk"
echo

echo "==================== TODO-LISTE ===================="
echo "1) Supabase SQL (kør i rækkefølge)"
echo "   1. sql/supabase-paintings-setup.sql"
echo "   2. sql/supabase-jewelry-setup.sql"
echo "   3. sql/supabase-events-setup.sql"
echo "   4. sql/supabase-about-setup.sql"
echo "   5. sql/supabase-forside-setup.sql"
echo "   6. sql/supabase-webshop-setup.sql"
echo "   7. sql/supabase-colors-setup.sql"
echo "   8. sql/supabase-seo-setup.sql"
echo "   9. sql/supabase-contact-setup.sql"
echo "  10. sql/supabase-admin-users-setup.sql"
echo
echo "2) Manglende env variabler (tjek i $TARGET_DIR/.env.local)"
echo "   Kræver udfyldning før go-live:"
echo "   - AUTH_SECRET"
echo "   - AUTH_URL"
echo "   - ADMIN_USERNAME"
echo "   - ADMIN_PASSWORD"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - SHIPMONDO_API_USER"
echo "   - SHIPMONDO_API_KEY"
echo "   - RESEND_API_KEY"
echo "   - NEXT_PUBLIC_SITE_URL"
echo "   Valgfri afhængig af setup:"
echo "   - ANTHROPIC_API_KEY"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_PROJECT_ID"
echo "   - VERCEL_TEAM_ID"
echo
ENCODED_REPO_URL="$(python3 - "$REPO_URL" <<'PY'
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
)"

echo "3) Vercel deploy"
echo "   Deploy knap:"
echo "   https://vercel.com/new/clone?repository-url=$ENCODED_REPO_URL"
echo
echo "4) Næste skridt"
echo "   cd \"$TARGET_DIR\""
echo "   npm install"
echo "   npm run lint && npx tsc --noEmit && npm run build"
echo "===================================================="
