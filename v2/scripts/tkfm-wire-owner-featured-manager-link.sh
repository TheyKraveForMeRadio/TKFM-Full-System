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

# Insert a small button link near Refresh/Export (search for exportBtn or refreshBtn)
perl -0777 -i -pe '
  my $ins = qq{\n        <a href="/owner-featured-manager.html" style="text-decoration:none">\n          <button class="btn" type="button">Featured Manager</button>\n        </a>\n};

  if ($_ =~ /id="exportBtn"/) {
    $_ =~ s/(<button[^>]*id="exportBtn"[^>]*>[^<]*<\/button>)/$1$ins/s;
    return $_;
  }

  if ($_ =~ /id="refreshBtn"/) {
    $_ =~ s/(<button[^>]*id="refreshBtn"[^>]*>[^<]*<\/button>)/$1$ins/s;
    return $_;
  }

  # fallback: put before closing of the top right controls div
  $_ =~ s#(<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">)#${1}#s;
  $_;
' "$F"

echo "OK: wired Featured Manager link into $F"
