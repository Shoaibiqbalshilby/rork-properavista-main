#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  . "${ROOT_DIR}/.env"
  set +a
fi

if [[ -f "${ROOT_DIR}/.env.local" ]]; then
  set -a
  . "${ROOT_DIR}/.env.local"
  set +a
fi

cd "${ROOT_DIR}"
exec ./node_modules/.bin/tsx backend/server.ts