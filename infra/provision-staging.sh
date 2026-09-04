#!/usr/bin/env bash
# Create D1 / R2 / Queue, apply migrations, deploy Pages + Workers to staging.
# Non-interactive. Uses CLOUDFLARE_API_TOKEN (and optional CLOUDFLARE_ACCOUNT_ID).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  cat <<'EOF'
Missing CLOUDFLARE_API_TOKEN.

Create a token in Cloudflare Dashboard → My Profile → API Tokens.
Template: "Edit Cloudflare Workers" plus D1, R2, Queues, and Pages edit.

Then:
  export CLOUDFLARE_API_TOKEN=...
  export CLOUDFLARE_ACCOUNT_ID=...   # optional if the token is scoped to one account
  ./infra/provision-staging.sh

Do not use `wrangler login` in this agent environment (no browser).
Do not use `wrangler deploy --temporary` (that is a throwaway account, not yours).
EOF
  exit 1
fi

WRANGLER=(npx --yes wrangler)
API_TOML="$ROOT/apps/api/wrangler.toml"
WORKER_TOML="$ROOT/apps/worker/wrangler.toml"
D1_NAME="safezone-ready-staging"
R2_NAME="szr-assets-staging"
QUEUE_NAME="szr-fix-jobs-staging"
PAGES_PROJECT="safezone-ready-web"

echo "== whoami =="
"${WRANGLER[@]}" whoami

echo "== D1 $D1_NAME =="
if ! "${WRANGLER[@]}" d1 list --json 2>/dev/null | grep -q "\"name\": \"$D1_NAME\""; then
  "${WRANGLER[@]}" d1 create "$D1_NAME"
else
  echo "D1 already exists"
fi

D1_ID="$("${WRANGLER[@]}" d1 list --json | node -e "
const rows = JSON.parse(require('fs').readFileSync(0,'utf8'));
const row = (Array.isArray(rows) ? rows : rows.result || []).find(r => r.name === process.argv[1]);
if (!row) { console.error('D1 not found'); process.exit(1); }
process.stdout.write(row.uuid || row.id);
" "$D1_NAME")"
echo "D1 id=$D1_ID"

echo "== R2 $R2_NAME =="
"${WRANGLER[@]}" r2 bucket create "$R2_NAME" || true

echo "== Queue $QUEUE_NAME =="
"${WRANGLER[@]}" queues create "$QUEUE_NAME" || true

echo "== patch wrangler database_id for staging =="
node - "$API_TOML" "$WORKER_TOML" "$D1_ID" <<'NODE'
const fs = require("fs");
const id = process.argv[4];
for (const file of [process.argv[2], process.argv[3]]) {
  let text = fs.readFileSync(file, "utf8");
  const marker = 'database_name = "safezone-ready-staging"';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`missing ${marker} in ${file}`);
  const slice = text.slice(idx);
  const next = slice.replace(
    /database_id = "[0-9a-f-]+"/,
    `database_id = "${id}"`,
  );
  text = text.slice(0, idx) + next;
  fs.writeFileSync(file, text);
  console.log("patched", file);
}
NODE

echo "== D1 migrations (remote staging via api config) =="
"${WRANGLER[@]}" d1 migrations apply "$D1_NAME" --remote --config "$API_TOML"

echo "== deploy API worker (staging) =="
"${WRANGLER[@]}" deploy --config "$API_TOML" --env staging

echo "== deploy queue consumer (staging) =="
"${WRANGLER[@]}" deploy --config "$WORKER_TOML" --env staging

echo "== build and deploy Pages =="
pnpm --filter @safezone-ready/web build
"${WRANGLER[@]}" pages project create "$PAGES_PROJECT" --production-branch main || true
"${WRANGLER[@]}" pages deploy "$ROOT/apps/web/dist" --project-name "$PAGES_PROJECT" --branch staging --commit-dirty=true

echo
echo "Staging provision finished."
echo "Next: attach custom domain staging.safezoneready.com in Pages,"
echo "uncomment the Worker route in apps/api/wrangler.toml, and wrangler secret put the keys."
echo "D1 id $D1_ID is now in both wrangler.toml files; commit that id."
