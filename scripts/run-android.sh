#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

ensure_java_home() {
  if [[ -n "${JAVA_HOME:-}" ]] && [[ -x "${JAVA_HOME}/bin/java" ]]; then
    return
  fi

  if [[ "$OSTYPE" == darwin* ]]; then
    local mac_java_home
    mac_java_home="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    if [[ -n "$mac_java_home" ]]; then
      export JAVA_HOME="$mac_java_home"
      return
    fi
  fi

  local fallback_java_home="${HOME}/Library/Java/JavaVirtualMachines/jdk-17.0.11+9/Contents/Home"
  if [[ -x "$fallback_java_home/bin/java" ]]; then
    export JAVA_HOME="$fallback_java_home"
    return
  fi

  echo "JDK 17 is required for Android builds. Install JDK 17 and try again." >&2
  exit 1
}

ensure_android_sdk_path() {
  local sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
  local adb_path="$sdk_root/platform-tools"

  if [[ -d "$adb_path" ]]; then
    export ANDROID_HOME="$sdk_root"
    export ANDROID_SDK_ROOT="$sdk_root"
    case ":$PATH:" in
      *":$adb_path:"*) ;;
      *) export PATH="$adb_path:$PATH" ;;
    esac
  fi
}

ensure_java_home
ensure_android_sdk_path

if ! command -v adb >/dev/null 2>&1; then
  echo "adb is not available. Install Android platform-tools or set ANDROID_HOME correctly." >&2
  exit 1
fi

cd "$ROOT_DIR"
"${ROOT_DIR}/scripts/ensure-local-api.sh"

lsof -ti:8081 | xargs kill -9 2>/dev/null || true
adb reverse tcp:8081 tcp:8081 || true
adb reverse tcp:8787 tcp:8787 || true

exec npx expo run:android