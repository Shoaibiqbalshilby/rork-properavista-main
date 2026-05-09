#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${LOCAL_API_PORT:-8787}"
HEALTHCHECK_URL="http://127.0.0.1:${API_PORT}/api"
LOG_FILE="${TMPDIR:-/tmp}/properavista-backend.log"

if curl -fsS "${HEALTHCHECK_URL}" >/dev/null 2>&1; then
  exit 0
fi

echo "Starting local backend API on port ${API_PORT}..."
cd "${ROOT_DIR}"
nohup bash ./scripts/run-backend.sh >"${LOG_FILE}" 2>&1 &