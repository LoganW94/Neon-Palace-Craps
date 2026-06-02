#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT="${PORT:-4173}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}"

echo "Starting Neon Palace Craps..."
echo "Opening ${URL}"
echo
echo "Keep this window open while you play."
echo "Press Control-C to stop the app."
echo

HOST="${HOST}" PORT="${PORT}" node backend/src/server.mjs &
SERVER_PID=$!

trap 'kill "${SERVER_PID}" >/dev/null 2>&1 || true' INT TERM EXIT

sleep 1
open "${URL}" >/dev/null 2>&1 || true

wait "${SERVER_PID}"
