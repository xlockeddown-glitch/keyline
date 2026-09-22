#!/bin/sh
set -eu
# Always run from the App Builder workspace containing this startup script.
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT_DIR"
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
fuser -k 8080/tcp 2>/dev/null || true
rm -rf .vite dist
AUDIT_PID=/tmp/trivia-audit.pid
if [ -f "$AUDIT_PID" ] && kill -0 "$(cat "$AUDIT_PID")" 2>/dev/null; then
  :
else
  node scripts/trivia-audit.mjs --watch >>/tmp/trivia-audit.log 2>&1 &
  echo $! > "$AUDIT_PID"
fi
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
