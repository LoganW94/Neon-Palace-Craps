#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

PORT="${PORT:-4173}"
HOST="127.0.0.1"
URL="http://${HOST}:${PORT}"
LOG_FILE=".neon-palace-server.log"

printf 'Starting Neon Palace Craps...\n'
printf 'Open %s in your browser.\n\n' "$URL"

if ! command -v node >/dev/null 2>&1; then
  if [ -x "/Applications/Codex.app/Contents/Resources/node" ]; then
    NODE_BIN="/Applications/Codex.app/Contents/Resources/node"
  elif [ -x "/opt/homebrew/bin/node" ]; then
    NODE_BIN="/opt/homebrew/bin/node"
  elif [ -x "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
  else
    printf 'Node.js is required but was not found.\n'
    printf 'Install Node.js from https://nodejs.org, then launch again.\n'
    exit 1
  fi
else
  NODE_BIN="$(command -v node)"
fi

if curl -fsS "$URL/api/health" >/dev/null 2>&1; then
  printf 'Neon Palace Craps is already running.\n'
  if command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  fi
  exit 0
fi

: > "$LOG_FILE"
HOST="$HOST" PORT="$PORT" "$NODE_BIN" backend/src/server.mjs >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!

trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' INT TERM EXIT

attempt=0
while [ "$attempt" -lt 40 ]; do
  if curl -fsS "$URL/api/health" >/dev/null 2>&1; then
    printf 'Server is ready. Opening browser...\n'
    if command -v open >/dev/null 2>&1; then
      open "$URL" >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
    fi
    wait "$SERVER_PID"
    exit $?
  fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    printf 'The server stopped before it was ready.\n\n'
    cat "$LOG_FILE"
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 0.25
done

printf 'The server started, but did not respond at %s.\n\n' "$URL"
cat "$LOG_FILE"
exit 1
