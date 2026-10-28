# Immutable content revisions

Content upload and attach append a row to `registry/content_revisions.jsonl` and
advance `Asset.current_revision_id`. Each row snapshots an ID, SHA256, size,
managed storage URI, timestamp, MIME type, filename, and metadata. The existing
asset hash/size/storage fields mirror the latest revision for compatibility.
A repeated attach of identical bytes still appends a revision; identical report
re-ingest retains the established no-op behavior. Index-only local-path imports
remain pointers until explicit backfill or attach preserves their bytes.

The ledger has no update/delete operation. Blob publication uses a no-replace
hard link; a pre-existing blob must match its hash. A shared reentrant POSIX
writer lease serializes asset mutations and content transactions, including
threads and processes. A durable ledger append precedes the current-pointer
update. A crash between those writes can retain an unreferenced revision; its
address and bytes remain valid. This is not a multi-file transactional database.
Protect the registry and blob volume together in backups. Disk corruption fails
closed on historical reads; it is never repaired by overwriting historical bytes.
Asset tombstones retain both ledger rows and blobs.

Use these asset-scoped API paths (`revision` is a revision ID or lowercase SHA256):

- `GET /api/assets/{asset}/revisions` lists snapshots in append order.
- `GET /api/assets/{asset}/revisions/{revision}` returns metadata. A SHA256
  shared by multiple snapshots selects the earliest matching metadata.
- `GET /api/assets/{asset}/revisions/{revision}/content` reads exact bytes.
- `GET /api/assets/{asset}/revisions/{revision}/export` downloads the same bytes
  with `X-Content-SHA256`, `ETag`, and `X-Revision-ID` headers.
- `POST /api/assets/{asset}/revisions/{revision}/restore` verifies the selected
  bytes and attaches them as a **new** latest revision. Existing asset metadata,
  links, status, and access policy remain intact.

Unknown IDs/hashes and selectors belonging to another asset return 404.
Historical bytes use the asset's current content policy, including 403 for
`metadata_only`/`none`. No selector falls back to current content. Hash/size
mismatches return 409; missing historical bytes return 404. Export is a raw body,
not a preview or an archive. Save it in binary mode and verify its SHA256 against
the selected metadata; restore reads the retained historical bytes.

## authority: migration

This JSONL project has no database migration runner. The explicit, journaled
migration follows the existing dry-run-first script convention:

```sh
python3 scripts/migrate_content_revisions.py up
python3 scripts/migrate_content_revisions.py up --apply
python3 scripts/migrate_content_revisions.py down
python3 scripts/migrate_content_revisions.py down --apply
```

Run on the deployment with the registry and original content mounted, using the
same `ATLAS_WORKSPACE_YAML`, `ATLAS_REGISTRY_DIR`, and `ATLAS_CONTENT_STORE_DIR`
settings as the API. Stop writers during migration/rollback and take a volume
backup first. Execution belongs to Nick's HR-attest migration lane; authoring
this migration does not authorize its application to production.

Forward migration validates every legacy local source before modifying assets,
copies its bytes into the managed store, and records one snapshot per asset.
Known hashes must match: a hash mismatch on an existing file still blocks the
migration (corruption, not absence). Assets that cannot be revisioned are
classified, left unchanged (parsed-equal; the registry file is reserialized on write), and given no revision: `pointer_only_outside_workspace`
(path resolves outside the workspace) and `pointer_only_missing_blob` (file
missing but a storage_uri or hash is recorded). They are reported under
`pointer_only` (count and ids per class); `--apply` also writes
`migrations/content_revisions_v1_report.json` in the registry dir, and a dry run
only prints the JSON. Nothing is deleted or rewritten, and nothing is fabricated. Metadata-only and remote pointers receive no fake
revision; their IDs are reported. Existing source files are never altered.

Before/after asset images live in
`registry/migrations/content_revisions_v1.jsonl`. Up is idempotent and can resume
an interrupted after-image write. Down restores exact original asset records,
refusing the whole batch if any migrated asset has since changed (including
metadata). After later writes, restore the historical revision through the API
instead of discarding that history. Down deliberately retains immutable ledger
rows and managed bytes, which keeps revision addresses valid and allows up/down/up
to reuse a snapshot. It removes the migration's asset pointers, not history.

Validation: `api/tests/test_content_revisions.py` has four numbered boundary
checks and the changed-report re-upload regression. Deployment, migration
application, and the historical/live-receipt/node-topic proofs for
`node_01M5ZTGXPRJZK72GKD67KF3WTR` must precede the reports pilot cutover or adapter
work. Passing local tests does not attest those live proofs.

## Acceptance evidence (2026-10-28)

| Build item | Boundary test in `api/tests/test_content_revisions.py` |
| --- | --- |
| 1: append-only revisions and current pointer | `test_ac1_every_attach_appends_even_same_bytes_and_serializes_writers` |
| 2: exact ID/SHA256 API reads, unknown 404, policy | `test_ac2_exact_addressing_missing_and_policy_boundaries` |
| 3: byte-identical export and restore | `test_ac3_revision_export_restore_is_byte_identical` |
| 4: reversible legacy backfill | `test_ac4_backfill_forward_backward_and_conflicting_rollback` |
| Worst failure: old report revision changes after re-upload | `test_worst_failure_report_reupload_never_changes_old_revision_bytes` |

The migration boundary also checks hash mismatch and missing-source refusal,
idempotency, interrupted-upgrade recovery, and refusal to roll back later writes.
The read boundary checks cross-asset selectors, changed policy, and corrupted or
missing managed bytes. There is no coverage target.

Full validation commands: `cd api && python3 -m pytest -q` (839 passed, 3 skipped)
and `cd web && npm run test` (149 passed in 17 files). The baseline API suite
already passed (834 passed, 3 skipped); no seeded-record-count fix was needed.
Playwright/browser capture cannot run in this clone sandbox and is not part of
`make test`; this change adds no UI. Live pilot acceptance remains pending.
