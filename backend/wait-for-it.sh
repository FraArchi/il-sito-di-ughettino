#!/usr/bin/env bash
# Minimal wait-for TCP script based on /dev/tcp
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 host:port -- command"
  exit 2
fi

TARGET="$1"; shift

HOST="${TARGET%%:*}"
PORT="${TARGET##*:}"

echo "Waiting for $HOST:$PORT ..."
while ! (echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1; do
  sleep 1
done

echo "$HOST:$PORT is available — running command: $@"
exec "$@"
