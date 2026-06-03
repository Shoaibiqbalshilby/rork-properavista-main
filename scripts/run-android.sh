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
  local emulator_path="$sdk_root/emulator"
  local cmdline_latest_path="$sdk_root/cmdline-tools/latest/bin"
  local cmdline_fallback_path="$sdk_root/cmdline-tools/bin"

  if [[ -d "$adb_path" ]]; then
    export ANDROID_HOME="$sdk_root"
    export ANDROID_SDK_ROOT="$sdk_root"
    case ":$PATH:" in
      *":$adb_path:"*) ;;
      *) export PATH="$adb_path:$PATH" ;;
    esac

    if [[ -d "$emulator_path" ]]; then
      case ":$PATH:" in
        *":$emulator_path:"*) ;;
        *) export PATH="$emulator_path:$PATH" ;;
      esac
    fi

    if [[ -d "$cmdline_latest_path" ]]; then
      case ":$PATH:" in
        *":$cmdline_latest_path:"*) ;;
        *) export PATH="$cmdline_latest_path:$PATH" ;;
      esac
    elif [[ -d "$cmdline_fallback_path" ]]; then
      case ":$PATH:" in
        *":$cmdline_fallback_path:"*) ;;
        *) export PATH="$cmdline_fallback_path:$PATH" ;;
      esac
    fi
  fi
}

has_connected_android_device() {
  adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit(found ? 0 : 1) }'
}

first_running_emulator_serial() {
  adb devices | awk 'NR > 1 && $1 ~ /^emulator-/ && $2 == "device" { print $1; exit }'
}

first_avd_name() {
  emulator -list-avds 2>/dev/null | head -n 1
}

first_system_image_package() {
  local sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
  local image_dir
  image_dir="$(find "$sdk_root/system-images" -mindepth 3 -maxdepth 3 -type d 2>/dev/null | sort | head -n 1 || true)"

  if [[ -z "$image_dir" ]]; then
    return 1
  fi

  local relative
  relative="${image_dir#"$sdk_root/system-images/"}"
  IFS='/' read -r api_tag vendor arch <<<"$relative"

  # avdmanager expects system image package ids like android-37, not android-37.0
  api_tag="${api_tag%%.0}"

  if [[ -z "${api_tag:-}" || -z "${vendor:-}" || -z "${arch:-}" ]]; then
    return 1
  fi

  printf 'system-images;%s;%s;%s\n' "$api_tag" "$vendor" "$arch"
}

has_usable_system_image() {
  local sdk_root="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
  find "$sdk_root/system-images" -mindepth 4 -maxdepth 4 -type f \( -name system.img -o -name package.xml -o -name source.properties \) -print -quit 2>/dev/null | grep -q .
}

ensure_default_system_image() {
  local default_package="system-images;android-36;google_apis;x86_64"

  if has_usable_system_image; then
    first_system_image_package
    return 0
  fi

  if ! command -v sdkmanager >/dev/null 2>&1; then
    return 1
  fi

  echo "Installing Android system image ${default_package}..." >&2
  yes | sdkmanager --install "$default_package" >/dev/null
  printf '%s\n' "$default_package"
}

create_default_avd() {
  if ! command -v avdmanager >/dev/null 2>&1; then
    return 1
  fi

  local image_package
  image_package="$(ensure_default_system_image || true)"
  if [[ -z "$image_package" ]]; then
    return 1
  fi

  local avd_name="Properavista_API"
  echo "No Android Virtual Device found. Creating ${avd_name} using ${image_package}..." >&2
  echo "no" | avdmanager create avd -n "$avd_name" -d pixel_8 -k "$image_package" --force >/dev/null
  printf '%s\n' "$avd_name"
}

wait_for_emulator_boot() {
  local serial="$1"
  local attempt

  for attempt in {1..120}; do
    if [[ "$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
      return 0
    fi
    sleep 2
  done

  return 1
}

boot_emulator_if_needed() {
  if has_connected_android_device; then
    return 0
  fi

  if ! command -v emulator >/dev/null 2>&1; then
    echo "Android emulator CLI not found. Ensure ${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator is installed." >&2
    return 1
  fi

  local avd_name
  avd_name="$(first_avd_name || true)"

  if [[ -z "$avd_name" ]]; then
    avd_name="$(create_default_avd || true)"
  fi

  if [[ -z "$avd_name" ]]; then
    echo "No Android device or emulator available." >&2
    echo "Create an AVD in Android Studio (Device Manager) and rerun npm run android." >&2
    return 1
  fi

  echo "Booting Android emulator: ${avd_name}"
  nohup emulator -avd "$avd_name" -netdelay none -netspeed full >"${TMPDIR:-/tmp}/properavista-android-emulator.log" 2>&1 &

  adb wait-for-device >/dev/null 2>&1 || true

  local serial
  serial="$(first_running_emulator_serial || true)"

  if [[ -z "$serial" ]]; then
    echo "Emulator started but no adb device was detected." >&2
    return 1
  fi

  if ! wait_for_emulator_boot "$serial"; then
    echo "Emulator did not finish booting in time." >&2
    return 1
  fi

  echo "Android emulator is ready: ${serial}"
}

ensure_java_home
ensure_android_sdk_path

if ! command -v adb >/dev/null 2>&1; then
  echo "adb is not available. Install Android platform-tools or set ANDROID_HOME correctly." >&2
  exit 1
fi

boot_emulator_if_needed

cd "$ROOT_DIR"
"${ROOT_DIR}/scripts/ensure-local-api.sh"

lsof -ti:8081 | xargs kill -9 2>/dev/null || true
adb reverse tcp:8081 tcp:8081 || true
adb reverse tcp:8787 tcp:8787 || true

exec npx expo run:android