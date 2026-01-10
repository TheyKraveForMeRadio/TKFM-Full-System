#!/usr/bin/env bash
set -euo pipefail

# TKFM: Install a pre-push hook that blocks pushes if secrets are detected.
# Safe to run multiple times.
#
# Usage:
#   ./scripts/tkfm-install-prepush-hook.sh
#
HOOK=".git/hooks/pre-push"
mkdir -p .git/hooks

cat > "$HOOK" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [ -x "./scripts/tkfm-secret-scan.sh" ]; then
  ./scripts/tkfm-secret-scan.sh --staged
else
  echo "WARN: ./scripts/tkfm-secret-scan.sh missing; skipping secret scan"
fi
EOF

chmod +x "$HOOK"
echo "OK: installed .git/hooks/pre-push"
