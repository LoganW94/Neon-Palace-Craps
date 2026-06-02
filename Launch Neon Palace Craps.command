#!/bin/zsh
set -e

cd "$(dirname "$0")"

PORT="${PORT:-4173}"
HOST="127.0.0.1"
URL="http://${HOST}:${PORT}"
LOG_FILE=".neon-palace-server.log"

echo "Starting Neon Palace Craps..."
echo "App URL: ${URL}"
echo
echo "Keep this window open while you play."
echo "Press Control-C to stop the app."
echo

if ! command -v node >/dev/null 2>&1; then
  if [ -x "/Applications/Codex.app/Contents/Resources/node" ]; then
    NODE_BIN="/Applications/Codex.app/Contents/Resources/node"
  elif [ -x "/opt/homebrew/bin/node" ]; then
    NODE_BIN="/opt/homebrew/bin/node"
  elif [ -x "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
  else
    echo "Node.js is required but was not found."
    echo "Install Node.js from https://nodejs.org, then launch again."
    echo
    read "unused?Press Return to close this window."
    exit 1
  fi
else
  NODE_BIN="$(command -v node)"
fi

if curl -fsS "${URL}/api/health" >/dev/null 2>&1; then
  echo "Neon Palace Craps is already running."
  open "${URL}" >/dev/null 2>&1 || true
  exit 0
fi

: > "${LOG_FILE}"
HOST="${HOST}" PORT="${PORT}" "${NODE_BIN}" backend/src/server.mjs >> "${LOG_FILE}" 2>&1 &
SERVER_PID=$!

trap 'kill "${SERVER_PID}" >/dev/null 2>&1 || true' INT TERM EXIT

for attempt in {1..40}; do
  if curl -fsS "${URL}/api/health" >/dev/null 2>&1; then
    echo "Server is ready. Opening browser..."
    open "${URL}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}"
    exit $?
  fi
  if ! kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    echo "The server stopped before it was ready."
    echo
    cat "${LOG_FILE}"
    echo
    read "unused?Press Return to close this window."
    exit 1
  fi
  sleep 0.25
done

echo "The server started, but did not respond at ${URL}."
echo
cat "${LOG_FILE}"
echo
open "${URL}" >/dev/null 2>&1 || true
read "unused?Press Return to close this window."
