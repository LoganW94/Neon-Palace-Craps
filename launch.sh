#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

PORT="${PORT:-4173}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}"

printf 'Starting Neon Palace Craps...\n'
printf 'Open %s in your browser.\n\n' "$URL"

HOST="$HOST" PORT="$PORT" node backend/src/server.mjs &
SERVER_PID=$!

trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' INT TERM EXIT

sleep 1

if command -v open >/dev/null 2>&1; then
  open "$URL" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
fi

wait "$SERVER_PID"
