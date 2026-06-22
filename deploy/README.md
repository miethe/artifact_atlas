# Artifact Atlas — deployment

Containerized deploy of the two services:

| Service | Container port | Image | Notes |
|---|---|---|---|
| `api` (FastAPI) | `8042` | `artifact-atlas-api:local` | JSONL/SQLite storage; mutable state on the `atlas-data` volume |
| `web` (Next.js) | `3040` | `artifact-atlas-web:local` | `NEXT_PUBLIC_API_BASE_URL` baked at build time |

## Local / manual run

```bash
cp deploy/.env.example deploy/.env      # edit ports / URLs if needed
( cd deploy && docker compose --env-file .env up -d --build )   # or: podman compose
curl -sf http://localhost:8042/health   # {"status":"ok",...}
# open http://localhost:3040
```

Stop: `( cd deploy && docker compose --env-file .env down )`.

## Agentic node (`rocket-fedora`, `10.42.10.76`)

Deployed as the opt-in `artifact-atlas` stack by
`agentic_meta_dev/infra/agentic-node/bootstrap-agentic-node.sh`:

```bash
# on the node (clones origin/main → ~/dev/artifact_atlas, builds, runs):
cd ~/dev/agentic_meta_dev/infra/agentic-node
bash bootstrap-agentic-node.sh --check artifact-atlas   # dry-run
bash bootstrap-agentic-node.sh artifact-atlas           # real run
bash bootstrap-agentic-node.sh persistence              # wire systemd --user autostart
systemctl --user status artifact-atlas.service
```

Default node ports: web `:3040`, api `:8042` (LAN-bound via `AOS_BIND_HOST`). The web
build bakes `http://<node-ip>:8042` as the API URL and the API allows the
`http://<node-ip>:3040` origin via CORS (`ATLAS_CORS_ORIGINS`).

## Key design points

- **`@miethe/ui@0.6.0` is on public npm** — the web build needs no registry auth.
- **`NEXT_PUBLIC_API_BASE_URL` is inlined at build time** — it must be the
  browser-reachable host:port, passed as a compose build arg, not a runtime env.
- **Mutable state → `/data` volume** via `ATLAS_REGISTRY_DIR` / `ATLAS_EXPORTS_DIR` /
  `ATLAS_REPORTS_DIR`; the API entrypoint seeds `/data/registry` from the baked seed
  on first boot only, so redeploys (image rebuild from a fresh git sync) preserve
  runtime writes.
- **UI flags ship default-on** (ADR-8): no `NEXT_PUBLIC_FLAGS` needed for the new UX.
  `pptx-server-conversion` stays off until a LibreOffice/Gotenberg backend exists
  (not installed in the API image).
