#!/usr/bin/env bash
# Artifact Atlas API container entrypoint.
#
# Seeds the persistent /data volume from the image's baked registry on FIRST boot
# only (so a fresh deploy shows the seeded asset graph rather than an empty Atlas),
# then launches uvicorn. Mutable state — registry, context-pack exports, reports —
# lives under /data via the ATLAS_* env overrides set in docker-compose.yml; the
# baked /app/* tree is the read-only seed + asset corpus (workspace_root == /app).
set -euo pipefail

DATA_DIR="${ATLAS_DATA_DIR:-/data}"

mkdir -p \
  "$DATA_DIR/registry" \
  "$DATA_DIR/exports/context-packs" \
  "$DATA_DIR/exports/reports" \
  "$DATA_DIR/exports/events"

# First-boot seed: only when the volume's registry is empty, copy the baked seed in.
# Idempotent — subsequent boots (volume non-empty) preserve runtime writes.
if [ -z "$(ls -A "$DATA_DIR/registry" 2>/dev/null || true)" ] && [ -d /app/registry ]; then
  cp -a /app/registry/. "$DATA_DIR/registry/" 2>/dev/null || true
  echo "[atlas-api] seeded ${DATA_DIR}/registry from baked /app/registry"
fi

# uvicorn must run from inside api/ so the local `app` package resolves (mirrors the
# Makefile `api` target). _REPO_ROOT is derived from the file location, not cwd, so
# data dirs still resolve under /app regardless.
cd /app/api
exec uvicorn app.main:app --host 0.0.0.0 --port "${ATLAS_API_PORT:-8042}"
