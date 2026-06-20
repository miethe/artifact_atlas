#!/usr/bin/env bash
set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

FAILED=0

# ==============================================================================
# Check 1: CLAUDE.md line count
# ==============================================================================
echo "Check 1: CLAUDE.md line count (max 400)"
if [ -f CLAUDE.md ]; then
  lines=$(wc -l < CLAUDE.md)
  if [ "$lines" -gt 400 ]; then
    echo -e "${RED}FAIL: CLAUDE.md has $lines lines (max 400)${NC}"
    FAILED=1
  else
    echo -e "${GREEN}PASS: CLAUDE.md has $lines lines (≤400)${NC}"
  fi
else
  echo -e "${RED}FAIL: CLAUDE.md not found${NC}"
  FAILED=1
fi

# ==============================================================================
# Check 2: Orphan count in .claude/context/
# ==============================================================================
echo ""
echo "Check 2: Orphan .md files in .claude/context/ (max 10)"

RETAINED_FILES=(
  "api-endpoint-mapping.md"
  "development-tracking-playbook.md"
  "stub-patterns.md"
  "symbol-usage-guide.md"
  "TEMPLATE.md"
)

if [ -d .claude/context ]; then
  orphan_count=0
  orphan_files=()

  # Find .md files at depth 1 only
  while IFS= read -r file; do
    filename=$(basename "$file")

    # Skip if in key-context or archive subdirectories
    if [[ "$file" =~ /.claude/context/(key-context|archive)/ ]]; then
      continue
    fi

    # Check if filename is in retained list
    is_retained=0
    for retained in "${RETAINED_FILES[@]}"; do
      if [ "$filename" = "$retained" ]; then
        is_retained=1
        break
      fi
    done

    if [ $is_retained -eq 0 ]; then
      orphan_count=$((orphan_count + 1))
      orphan_files+=("$file")
    fi
  done < <(find .claude/context -maxdepth 1 -name "*.md" -type f)

  if [ "$orphan_count" -gt 10 ]; then
    echo -e "${RED}FAIL: Found $orphan_count orphan .md files (max 10)${NC}"
    for file in "${orphan_files[@]}"; do
      echo "  - $file"
    done
    FAILED=1
  else
    echo -e "${GREEN}PASS: Found $orphan_count orphan .md files (≤10)${NC}"
    if [ "$orphan_count" -gt 0 ]; then
      for file in "${orphan_files[@]}"; do
        echo "  - $file"
      done
    fi
  fi
else
  echo -e "${RED}FAIL: .claude/context/ directory not found${NC}"
  FAILED=1
fi

# ==============================================================================
# Check 3: Frontmatter coverage in .claude/context/key-context/
# ==============================================================================
echo ""
echo "Check 3: Frontmatter coverage in .claude/context/key-context/"

REQUIRED_FIELDS=("title" "description" "type" "domain" "status")
frontmatter_failed=0

if [ -d .claude/context/key-context ]; then
  while IFS= read -r file; do
    # Check if file starts with ---
    if ! head -1 "$file" | grep -q '^---$'; then
      echo -e "${RED}FAIL: $file - missing frontmatter (doesn't start with ---)${NC}"
      frontmatter_failed=1
      FAILED=1
      continue
    fi

    # Check for all required fields
    missing_fields=()
    for field in "${REQUIRED_FIELDS[@]}"; do
      if ! grep -q "^${field}:" "$file"; then
        missing_fields+=("$field")
      fi
    done

    if [ ${#missing_fields[@]} -gt 0 ]; then
      echo -e "${RED}FAIL: $file - missing fields: ${missing_fields[*]}${NC}"
      frontmatter_failed=1
      FAILED=1
    else
      echo -e "${GREEN}PASS: $file - has all required fields${NC}"
    fi
  done < <(find .claude/context/key-context -maxdepth 1 -name "*.md" -type f)

  if [ $frontmatter_failed -eq 0 ]; then
    echo -e "${GREEN}PASS: All frontmatter checks passed${NC}"
  fi
else
  echo -e "${RED}FAIL: .claude/context/key-context/ directory not found${NC}"
  FAILED=1
fi

# ==============================================================================
# Exit
# ==============================================================================
echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All checks passed${NC}"
  exit 0
else
  echo -e "${RED}Some checks failed${NC}"
  exit 1
fi
