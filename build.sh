#!/usr/bin/env bash
# Builds backend and frontend from a clean state (CI-safe).
# Prerequisites: Node 20+, npm 10+
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

step()  { echo -e "\n${BOLD}▶  $*${RESET}"; }
ok()    { echo -e "${GREEN}✓  $*${RESET}"; }
fatal() { echo -e "${RED}✗  $*${RESET}" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Node version guard
# ---------------------------------------------------------------------------
REQUIRED_NODE=20
command -v node >/dev/null 2>&1 || fatal "node not found — install Node.js $REQUIRED_NODE+"
ACTUAL_NODE=$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')
[ "$ACTUAL_NODE" -ge "$REQUIRED_NODE" ] \
  || fatal "Node $REQUIRED_NODE+ required (found $(node -v))"

step "Runtime: Node $(node -v) / npm $(npm -v)"

# ---------------------------------------------------------------------------
# Install exact versions from lock file (fails if lock is stale)
# ---------------------------------------------------------------------------
step "Installing dependencies…"
npm ci
ok "node_modules up to date"

# ---------------------------------------------------------------------------
# Backend — prisma generate ensures client matches current schema, then tsc
# ---------------------------------------------------------------------------
step "Building backend…"
npm run build --workspace=backend
ok "backend/dist/ ready"

# ---------------------------------------------------------------------------
# Frontend — tsc type-check + vite bundle
# ---------------------------------------------------------------------------
step "Building frontend…"
npm run build --workspace=frontend
ok "frontend/dist/ ready"

# ---------------------------------------------------------------------------
# Artifact summary
# ---------------------------------------------------------------------------
step "Artifacts"
BACKEND_SIZE=$(du -sh backend/dist  2>/dev/null | cut -f1 || echo "—")
FRONTEND_SIZE=$(du -sh frontend/dist 2>/dev/null | cut -f1 || echo "—")
printf "  %-30s %s\n" "backend/dist/"  "$BACKEND_SIZE"
printf "  %-30s %s\n" "frontend/dist/" "$FRONTEND_SIZE"

echo -e "\n${GREEN}${BOLD}Build successful.${RESET}"
