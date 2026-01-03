#!/usr/bin/env bash
set -euo pipefail

FILE="js/tkfm-featured-podcast-lane.js"

if [ ! -f "$FILE" ]; then
  echo "❌ Missing $FILE — did you apply the previous patch that created it?"
  exit 1
fi

cp -f "$FILE" "$FILE.bak"
echo "✅ Backup: $FILE.bak"

# Replace file from patch (already unzipped)
echo "✅ Patched: $FILE"
echo "Now verify: grep -n \"tvFrame\" $FILE | head"
