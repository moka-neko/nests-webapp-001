#!/usr/bin/env bash
# docker build を実行し、Docker Hub の一時的な 502 等で失敗した場合はリトライする。
set -euo pipefail

MAX_ATTEMPTS="${DOCKER_BUILD_MAX_ATTEMPTS:-5}"
SLEEP_SECONDS="${DOCKER_BUILD_RETRY_SLEEP_SECONDS:-15}"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 [docker build arguments...]" >&2
  exit 1
fi

attempt=1
while true; do
  if docker build "$@"; then
    exit 0
  fi
  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "docker build failed after ${MAX_ATTEMPTS} attempts" >&2
    exit 1
  fi
  echo "docker build failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${SLEEP_SECONDS}s..." >&2
  sleep "$SLEEP_SECONDS"
  attempt=$((attempt + 1))
  SLEEP_SECONDS=$((SLEEP_SECONDS * 2))
done
