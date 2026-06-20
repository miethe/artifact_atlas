# Artifact Atlas Pilot Checklist

**Purpose**: Validate MVP functionality with ~25 real ChatGPT image outputs before production release.

**Duration**: 2–4 hours  
**Operator**: Project owner or designated pilot user  
**Success Criteria**: All items checked; no blocking errors; feedback recorded

---

## Pre-Pilot Setup

- [ ] Clone/pull latest `main` branch
- [ ] Install API dependencies: `cd api && pip install -r requirements.txt`
- [ ] Install web dependencies: `cd web && npm install`
- [ ] Run API tests: `cd api && python3 -m pytest -q` (should see "469 passed")
- [ ] Verify no build errors: `cd web && npm run build` (should complete without errors)
- [ ] Create pilot project: `atlas project create --name "Pilot: ChatGPT Outputs"`

---

## Part 1: Asset Import (15–20 min)

Validate that files are imported, thumbnails generated, and metadata extracted.

### Prepare Test Data

- [ ] Collect 25 real ChatGPT image outputs (PNG, JPG, or PDF exports)
- [ ] Save to a single folder: `~/atlas-pilot-data/`
- [ ] Note: Include mixed aspect ratios, sizes, and content types (screenshots, generated images, PDFs)

### Import via CLI

```bash
atlas import ~/atlas-pilot-data/* --project "Pilot: ChatGPT Outputs"
```

- [ ] No errors reported
- [ ] Assets count shown at end (should be 25)
- [ ] Check `registry/assets.jsonl` — all 25 asset records present
- [ ] Check `assets/thumbnails/` — thumbnail files created for image assets
- [ ] Status is `raw` (post-import, pre-classification)
- [ ] Sensitivity defaults to `personal`

### Import via Web UI

1. Go to http://localhost:3000
2. Navigate to **Assets** page
3. Click **Import** button
4. Select 5–10 additional files to test UI path

- [ ] Files upload without errors
- [ ] Web shows "Import successful" notification
- [ ] New assets appear in asset list

---

## Part 2: Inbox Triage & Classification (20–30 min)

Validate classification workflow and status transitions.

### Inbox Page

1. Go to **Inbox** page
2. Verify all 25–35 imported assets appear with `inbox` or `raw` status

- [ ] Inbox list loads without errors
- [ ] Assets have thumbnail previews where applicable
- [ ] Pagination or virtualization works (no lag with 30+ items)

### Single-Asset Classification

1. Click first asset to open detail drawer
2. Fill in:
   - **Artifact Type**: "ChatGPT Output" (or select from list)
   - **Sensitivity**: "personal"
   - **Tags**: "pilot, generated"
3. Click **Classify**

- [ ] Asset status changes to `candidate` (or `raw` if only type set)
- [ ] Drawer shows updated status
- [ ] Asset disappears from Inbox (no longer `inbox` status)
- [ ] Check `registry/assets.jsonl` — status persisted

### Bulk Classification

1. Return to **Inbox**
2. Select 5 assets (checkboxes)
3. Click **Bulk Assign**
4. Set shared type and sensitivity
5. Click **Apply**

- [ ] All 5 assets status changes in one action
- [ ] No UI hangs (bulk operation completes <5s)
- [ ] Asset list updates without full page reload

### Classify Remaining Assets

Classify all 25+ assets one-by-one or in batches.

- [ ] All assets transition from `inbox` → `raw` or `candidate` (no errors)
- [ ] At least 3 different artifact types used (variety of classification)

---

## Part 3: Apply a BOM Template (10–15 min)

Validate template application and slot creation.

### Apply Template via Web UI

1. Go to **Command Center** (project home)
2. Click **Apply Template**
3. Choose **"New Product App"** template
4. Click **Apply**

- [ ] No errors
- [ ] BOM created with visible domains (Strategy, Product, Architecture, etc.)
- [ ] Each domain shows slots with status badges (missing/partial/complete)
- [ ] BOM appears in project home as "BOM 1" or similar

### Verify BOM in Registry

```bash
cat registry/bom.jsonl | jq '.domains[] | length'
# Should show 5 (five domains from template)
```

- [ ] `registry/bom.jsonl` contains one BOM record
- [ ] BOM has `template_id: new-product-app`
- [ ] All 5 domains present with correct names

---

## Part 4: Assign Assets to Slots (25–35 min)

Validate drag-drop/click assignment workflow and coverage calculation.

### BOM Overview Page

1. Go to **Artifact BOM** page
2. View the applied BOM structure

- [ ] Domains and slots render without lag
- [ ] Coverage score is shown (should be 0% initially)
- [ ] Slot status badges are visible (all `missing` or `partial`)

### Assign Assets via Click

1. Click on a slot (e.g., "Product Strategy" under Strategy domain)
2. **Assign Asset** dialog opens
3. Search for or select an asset (filter by type)
4. Click **Assign**

- [ ] Asset appears assigned to slot
- [ ] Slot status updates (e.g., `missing` → `partial`)
- [ ] Assignment saved to `registry/bom.jsonl`
- [ ] Coverage score recalculates (increases from 0%)

### Assign Multiple Assets to Slots

1. Assign 10–15 assets to different slots across the BOM
2. Mix assignment methods: click, keyboard, and (if available) drag

- [ ] All assignments save without error
- [ ] Slot statuses update (some become `complete` if minimum met)
- [ ] Coverage score increases progressively (verify with each assignment)
- [ ] Assignment status is `accepted` (human-approved) in `registry/bom.jsonl`

### Check Inbox-to-BOM Flow

1. Go back to **Inbox**
2. Find an unassigned asset
3. Click **Assign to BOM Slot** (if available in drawer)
4. Choose slot from dropdown
5. Click **Assign**

- [ ] Asset immediately moves to slot
- [ ] Slot status and coverage recalculate
- [ ] Asset no longer appears in Inbox (promoted from `inbox`/`raw`)

---

## Part 5: View Coverage & Gaps (5–10 min)

Validate coverage calculation and gap identification.

### Coverage Page

1. Go to **Coverage & Gaps** page
2. View coverage score (should be 30–70% depending on assignments)
3. View critical gaps list (missing required slots)

- [ ] Coverage score updates correctly (roughly: assets assigned / total slots required)
- [ ] Critical gaps list shows empty or partially-filled required slots
- [ ] "Stale Assets" section appears (empty or lists old assets)
- [ ] Click on a gap → jumps to BOM page at correct slot

### CLI Coverage Check

```bash
atlas bom status --project "Pilot: ChatGPT Outputs"
```

- [ ] Command completes without error
- [ ] Output shows coverage percentage matching web UI
- [ ] Critical gaps list matches web UI

---

## Part 6: Build & Export Context Packs (15–20 min)

Validate pack composition, preview, and export formats.

### Create Context Pack

1. Go to **Context Pack Builder**
2. Click **New Pack**
3. Name: "Pilot Context Pack"
4. Click **Add Assets**
5. Select 5–10 assigned assets

- [ ] Asset search/filter works
- [ ] Selected assets appear in the pack preview
- [ ] Asset cards show title, type, status

### Set Policy Mode

1. Choose **Policy Mode**: "Exclude Sensitive"
2. All assets are `personal`, so all included
3. Click **Preview**

- [ ] Token estimate displayed (should be reasonable, e.g., 5k–10k tokens for 10 assets)
- [ ] Asset list in preview shows policy applied
- [ ] Sensitive masking indicator present (even if no sensitive assets)

### Export Formats

1. Click **Export** → **YAML Manifest**

- [ ] File downloads: `exports/context-packs/pilot-context-pack-<timestamp>.yaml`
- [ ] YAML is valid and parsable:

```bash
python3 -c "import yaml; yaml.safe_load(open('exports/context-packs/pilot-context-pack-*.yaml'))" 
# Should not error
```

- [ ] Manifest includes `context_pack`, `policy`, `assets` keys
- [ ] All 5–10 assets listed with `id`, `title`, `sensitivity`

2. Export again → **Markdown Report**

- [ ] File downloads: `exports/context-packs/pilot-context-pack-<timestamp>.md`
- [ ] Markdown is readable:

```bash
cat exports/context-packs/pilot-context-pack-*.md | head -20
```

- [ ] Includes pack metadata, asset cards, and policy notes
- [ ] Human-readable format for sharing

---

## Part 7: Policy & Security Checks (10–15 min)

Validate that policy gates work and denials are audited.

### Audit Events

1. Check audit log:

```bash
atlas audit list --project "Pilot: ChatGPT Outputs" | head -20
```

Or view in registry:

```bash
cat registry/events.jsonl | jq '.event_type' | sort | uniq -c
```

- [ ] `asset_added` events present (one per imported asset)
- [ ] `bom_template_applied` event recorded
- [ ] `bom_slot_filled` or similar events for assignments
- [ ] `context_pack_created` event for new pack
- [ ] All events have `timestamp`, `actor`, `resource_id`

### Policy Denial (if applicable)

If assets with `work_sensitive` or `client_sensitive` exist:

1. Create a second context pack
2. Toggle **Include Sensitive** OFF
3. Try to add a sensitive asset

- [ ] Sensitive asset is unavailable or marked as "masked by policy"
- [ ] Export excludes sensitive content
- [ ] A `policy_denied` event is recorded (check `events.jsonl`)

### Network Isolation

1. Verify API binds to loopback only:

```bash
curl http://127.0.0.1:8000/health
# Should respond with 200 OK

curl http://localhost:8000/health
# Should also work (localhost = 127.0.0.1)
```

- [ ] API responds on loopback
- [ ] No warning if bound to loopback (expected)

---

## Part 8: UI Quality & Performance (10–15 min)

Smoke test visual consistency, keyboard navigation, and load times.

### Visual Checks

Navigate to each core page and verify no layout breaks:

- [ ] **Command Center**: KPI cards visible, layout clean
- [ ] **Asset Gallery**: Thumbnail grid renders (no overlap/clipping)
- [ ] **Inbox**: Asset list visible, status badges clear
- [ ] **Artifact BOM**: Domains and slots render, coverage score visible
- [ ] **Coverage & Gaps**: Gap list readable, links work
- [ ] **Template Library**: Template cards visible, metadata present
- [ ] **Context Pack Builder**: Asset search works, pack preview renders

### Performance Baseline

With 25–35 assets in the project:

- [ ] Asset gallery initial load < 3 seconds
- [ ] Filter/search updates < 1 second (no lag typing in search bar)
- [ ] BOM page loads < 2 seconds
- [ ] Coverage calculation < 1 second
- [ ] Export file generation < 5 seconds

### Keyboard Navigation

1. Navigate using Tab and arrow keys only (no mouse)
2. Focus visible on all interactive elements
3. Enter/Space activates buttons and links

- [ ] Can reach all core controls without mouse (if drag-drop required, skip)
- [ ] Focus indicators visible and not hidden
- [ ] Drawer open/close works with keyboard (Escape to close)

---

## Part 9: Data Portability & Export (5–10 min)

Verify that registry files are portable and can be safely backed up.

### Registry Backup

```bash
cp -r registry/ ~/atlas-pilot-backup/
```

- [ ] Copy completes without error
- [ ] All JSONL files are present:
  - `projects.jsonl` (1+ project)
  - `assets.jsonl` (25+ assets)
  - `bom.jsonl` (1+ BOM)
  - `context-packs.jsonl` (1+ pack)
  - `events.jsonl` (50+ events from pilot)

### Validate JSONL Format

```bash
python3 scripts/validate_registry_exports.py
# Or manually:
for file in registry/*.jsonl; do
  echo "Checking $file..."
  python3 -c "import json; [json.loads(line) for line in open('$file')]"
done
```

- [ ] All JSONL files parse as valid JSON
- [ ] No truncated or malformed lines
- [ ] Event timestamps are ISO 8601 format

### Registry Diff

```bash
diff -u ~/atlas-pilot-backup/assets.jsonl registry/assets.jsonl | head -20
```

- [ ] Changes are readable diffs (one JSON object per line)
- [ ] Asset status transitions visible in diffs (inbox → raw → candidate, etc.)

---

## Part 10: Documentation & Handoff (5 min)

Verify user-facing docs are complete and accurate.

- [ ] README.md covers install, run, test, local-first caveats
- [ ] `docs/user-workflows.md` covers all 8 workflows tested above
- [ ] `docs/architecture.md` describes system tiers accurately
- [ ] `docs/DECISIONS.md` lists policies and rationale
- [ ] `docs/agent-handoff.md` lists CLI/MCP commands with examples

Try following README from scratch on a clean clone:

1. Clone the repo
2. Follow README "Quick Start" section
3. Run each command

- [ ] Instructions are clear and commands work (first-run experience)
- [ ] No typos or broken links

---

## Part 11: Feedback & Issues (as needed)

Record any observations during the pilot:

### Performance Issues

- [ ] Note page/feature with slow load (>3s)
- [ ] Record browsers/OS if applicable
- [ ] Log slow query or N+1 pattern found

### UI/UX Issues

- [ ] Screenshot any layout breaks, overlaps, or unclear labels
- [ ] Note confusing workflows or missing affordances
- [ ] List accessibility failures (keyboard, focus, color contrast)

### Bugs

- [ ] Describe error steps to reproduce
- [ ] Attach error message or stack trace from browser console / API logs
- [ ] Note whether issue blocks workflow or is cosmetic

### Feature Requests

- [ ] Document features found missing during pilot
- [ ] Reference back to spec if requirement is documented
- [ ] Assess impact on pilot vs. Phase 6 scope

---

## Sign-Off

- [ ] All 11 parts completed
- [ ] No blocking errors encountered
- [ ] Coverage & gaps feature works end-to-end
- [ ] Export files are valid and portable
- [ ] Audit log captures all major actions
- [ ] Pilot project remains in `registry/` for reproducibility

**Pilot Date**: _______________  
**Operator**: _______________  
**Issues Found**: _____ (count)  
**Recommendation**: READY FOR RELEASE / NEEDS FIXES

**Notes**:

```
[Paste any issues, performance observations, or feedback here]
```

---

## Cleanup (Optional)

After pilot sign-off, optionally preserve or remove pilot data:

```bash
# Keep for reproducibility / regression testing
# Or remove to start fresh:
rm registry/assets.jsonl registry/bom.jsonl registry/context-packs.jsonl registry/events.jsonl
# (preserves projects.jsonl and templates.jsonl)
```

---

**End of Checklist**
