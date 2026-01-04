#!/usr/bin/env bash
set -euo pipefail

# TKFM: add a button link to owner pages pointing to owner-stripe-verifier.html
# Safe/no-op if already present.

ROOT="${1:-.}"
cd "$ROOT"

insert_into () {
  local F="$1"
  [ -f "$F" ] || { echo "SKIP: $F not found"; return 0; }
  if grep -q "owner-stripe-verifier.html" "$F"; then
    echo "OK: link already present in $F"
    return 0
  fi

  local INS
  INS=$(cat <<'HTML'
<a href="/owner-stripe-verifier.html" style="text-decoration:none">
  <button class="btn" type="button">Stripe Verifier</button>
</a>
HTML
)

  # Insert after Featured Manager link if present, else after refresh/export, else before closing of top controls div
  perl -0777 -i -pe '
    my $ins = $ENV{TKFM_INS};

    if (index($_, "owner-stripe-verifier.html") != -1) { next; }

    if ($_ =~ /owner-featured-manager\.html/ && $_ =~ /(owner-featured-manager\.html[^<]*<\/a>)/s) {
      $_ =~ s/(<a[^>]*owner-featured-manager\.html[^>]*>[\s\S]*?<\/a>)/$1\n$ins/s;
      next;
    }

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

  echo "OK: wired Stripe Verifier link into $F"
}

export TKFM_INS="$(cat <<'HTML'
<a href="/owner-stripe-verifier.html" style="text-decoration:none">
  <button class="btn" type="button">Stripe Verifier</button>
</a>
HTML
)"

insert_into "owner-paid-lane-inbox.html"
insert_into "owner-featured-manager.html"
