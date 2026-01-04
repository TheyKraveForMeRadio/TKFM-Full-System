#!/usr/bin/env bash
set -euo pipefail

# TKFM: add a link button to owner-paid-lane-inbox.html pointing to owner-featured-manager.html
# Safe insert: if it already contains owner-featured-manager.html, no-op.

ROOT="${1:-.}"
cd "$ROOT"

F="owner-paid-lane-inbox.html"
[ -f "$F" ] || { echo "SKIP: $F not found"; exit 0; }

if grep -q "owner-featured-manager.html" "$F"; then
  echo "OK: link already present in $F"
  exit 0
fi

INS=$(cat <<'HTML'
<a href="/owner-featured-manager.html" style="text-decoration:none">
  <button class="btn" type="button">Featured Manager</button>
</a>
HTML
)

# Preferred: insert right after Export button (if present), else after Refresh, else before close of top controls.
perl -0777 -i -pe '
  my $ins = $ENV{TKFM_INS};

  if (index($_, "owner-featured-manager.html") != -1) { next; }

  if ($_ =~ /(id="exportBtn"[^>]*>.*?<\/button>)/s) {
    $_ =~ s/(<button[^>]*id="exportBtn"[^>]*>.*?<\/button>)/$1\n$ins/s;
    next;
  }

  if ($_ =~ /(id="refreshBtn"[^>]*>.*?<\/button>)/s) {
    $_ =~ s/(<button[^>]*id="refreshBtn"[^>]*>.*?<\/button>)/$1\n$ins/s;
    next;
  }

  if ($_ =~ /(<div\s+style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">)/s) {
    $_ =~ s/(<div\s+style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">)/$1\n$ins/s;
    next;
  }
' "$F"

echo "OK: wired Featured Manager link into $F"
