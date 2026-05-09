#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="${ROOT_DIR}/ios"
CONFIG_SCRIPT="${IOS_DIR}/Pods/Target Support Files/Pods-Properavista/expo-configure-project.sh"
AUTOLINKING_JSON="${IOS_DIR}/build/generated/autolinking/autolinking.json"
APP_BUNDLE_ID="com.properavista"
XCODE_WORKSPACE="${IOS_DIR}/Properavista.xcworkspace"
XCODE_SCHEME="Properavista"
DERIVED_DATA_DIR="${IOS_DIR}/build/derived-data"
SIMULATOR_APP_PATH="${DERIVED_DATA_DIR}/Build/Products/Debug-iphonesimulator/Properavista.app"
EXPO_SCHEME="myapp"
METRO_PORT="8081"
METRO_LOG_PATH="${ROOT_DIR}/.expo/ios-metro.log"
METRO_PID_PATH="${ROOT_DIR}/.expo/ios-metro.pid"

metro_status_url() {
  printf 'http://127.0.0.1:%s/status' "${METRO_PORT}"
}

metro_is_running() {
  curl -fsS "$(metro_status_url)" 2>/dev/null | grep -q 'packager-status:running'
}

start_metro() {
  mkdir -p "${ROOT_DIR}/.expo"
  lsof -ti:"${METRO_PORT}" | xargs kill -9 2>/dev/null || true

  echo "Starting Metro in the background..."
  nohup npx expo start --dev-client --host lan --port "${METRO_PORT}" >"${METRO_LOG_PATH}" 2>&1 < /dev/null &
  echo $! >"${METRO_PID_PATH}"

  local attempt
  for attempt in {1..60}; do
    if metro_is_running; then
      return 0
    fi
    sleep 1
  done

  echo "Metro failed to start. Recent log output:" >&2
  tail -n 40 "${METRO_LOG_PATH}" >&2 || true
  return 1
}

open_dev_client() {
  local simulator_udid="$1"
  local encoded_url
  encoded_url="$(node -e 'process.stdout.write(encodeURIComponent(`http://127.0.0.1:'"${METRO_PORT}"'`));')"

  open -a Simulator >/dev/null 2>&1 || true
  xcrun simctl terminate "${simulator_udid}" "${APP_BUNDLE_ID}" >/dev/null 2>&1 || true
  xcrun simctl openurl "${simulator_udid}" "${EXPO_SCHEME}://expo-development-client/?url=${encoded_url}" >/dev/null

  echo "Metro is running in the background. Logs: ${METRO_LOG_PATH}"
}

native_rebuild_needed() {
  if [[ ! -d "${SIMULATOR_APP_PATH}" ]]; then
    return 0
  fi

  if [[ -n "$(find "${IOS_DIR}/Properavista" -type f -newer "${SIMULATOR_APP_PATH}" -print -quit 2>/dev/null)" ]]; then
    return 0
  fi

  local tracked_file
  for tracked_file in \
    "${IOS_DIR}/Properavista.xcodeproj/project.pbxproj" \
    "${IOS_DIR}/Podfile.lock" \
    "${ROOT_DIR}/app.json" \
    "${ROOT_DIR}/package.json"
  do
    if [[ -f "${tracked_file}" && "${tracked_file}" -nt "${SIMULATOR_APP_PATH}" ]]; then
      return 0
    fi
  done

  return 1
}

boot_simulator() {
  local booted_udid
  booted_udid="$(xcrun simctl list devices booted -j | node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(0, "utf8")); for (const runtime of Object.values(data.devices)) { const device = runtime.find((entry) => entry.state === "Booted" && entry.isAvailable); if (device) { process.stdout.write(device.udid); process.exit(0); } } process.exit(1);' 2>/dev/null || true)"

  if [[ -n "${booted_udid}" ]]; then
    echo "${booted_udid}"
    return 0
  fi

  local target_udid
  target_udid="$(xcrun simctl list devices available -j | node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync(0, "utf8")); const score = (name) => { if (/iPhone 16 Pro Max/.test(name)) return 0; if (/iPhone 16 Pro/.test(name)) return 1; if (/iPhone 16/.test(name)) return 2; if (/iPhone/.test(name)) return 3; return 10; }; const candidates = []; for (const [runtime, devices] of Object.entries(data.devices)) { if (!runtime.includes("iOS")) continue; for (const device of devices) { if (!device.isAvailable) continue; if (!/^iPhone/.test(device.name)) continue; candidates.push({ runtime, ...device }); } } candidates.sort((left, right) => score(left.name) - score(right.name) || right.runtime.localeCompare(left.runtime) || left.name.localeCompare(right.name)); if (candidates[0]) { process.stdout.write(candidates[0].udid); process.exit(0); } process.exit(1);' 2>/dev/null || true)"

  if [[ -z "${target_udid}" ]]; then
    echo "No available iOS simulator found." >&2
    exit 1
  fi

  open -a Simulator >/dev/null 2>&1 || true
  xcrun simctl boot "${target_udid}" >/dev/null 2>&1 || true
  echo "${target_udid}"
}

build_and_launch_with_xcode() {
  if [[ ! -d "${XCODE_WORKSPACE}" ]]; then
    return 1
  fi

  local simulator_udid
  simulator_udid="$(boot_simulator)"

  echo "Building iOS app with Xcode workspace for simulator ${simulator_udid}..."
  xcodebuild \
    -workspace "${XCODE_WORKSPACE}" \
    -scheme "${XCODE_SCHEME}" \
    -configuration Debug \
    -destination "id=${simulator_udid}" \
    -derivedDataPath "${DERIVED_DATA_DIR}" \
    build

  if [[ ! -d "${SIMULATOR_APP_PATH}" ]]; then
    echo "Built app was not found at ${SIMULATOR_APP_PATH}." >&2
    exit 1
  fi

  xcrun simctl install "${simulator_udid}" "${SIMULATOR_APP_PATH}" >/dev/null
  start_metro
  open_dev_client "${simulator_udid}"
}

launch_installed_dev_client() {
  if native_rebuild_needed; then
    return 1
  fi

  local simulator_udid
  simulator_udid="$(boot_simulator)"

  if ! xcrun simctl get_app_container "${simulator_udid}" "${APP_BUNDLE_ID}" app >/dev/null 2>&1; then
    return 1
  fi

  echo "CocoaPods CLI is unavailable. Using the installed iOS development build instead of rebuilding native code."
  start_metro
  open_dev_client "${simulator_udid}"
}

needs_path_refresh=false

if [[ ! -f "${CONFIG_SCRIPT}" ]]; then
  needs_path_refresh=true
elif ! grep -Fq "${ROOT_DIR}" "${CONFIG_SCRIPT}"; then
  needs_path_refresh=true
fi

if [[ "${needs_path_refresh}" == true ]]; then
  echo "Refreshing iOS generated paths for current workspace..."
  CURRENT_ROOT="${ROOT_DIR}" CURRENT_IOS_DIR="${IOS_DIR}" CURRENT_CONFIG_SCRIPT="${CONFIG_SCRIPT}" CURRENT_AUTOLINKING_JSON="${AUTOLINKING_JSON}" node <<'EOF'
const fs = require('fs');

const currentRoot = process.env.CURRENT_ROOT;
const currentIosDir = process.env.CURRENT_IOS_DIR;
const configScriptPath = process.env.CURRENT_CONFIG_SCRIPT;
const autolinkingJsonPath = process.env.CURRENT_AUTOLINKING_JSON;

const workspaceRootPattern = /\/Users\/[^/]+\/(?:Downloads\/)?rork-properavista-main/g;

if (fs.existsSync(configScriptPath)) {
  const original = fs.readFileSync(configScriptPath, 'utf8');
  const updated = original
    .replace(workspaceRootPattern, currentRoot)
    .replace(/--target\s+"[^"]*ExpoModulesProvider\.swift"/, `--target "${currentIosDir}/Pods/Target Support Files/Pods-Properavista/ExpoModulesProvider.swift"`)
    .replace(/--entitlement\s+"[^"]*Properavista\.entitlements"/, `--entitlement "${currentIosDir}/Properavista/Properavista.entitlements"`);

  if (updated !== original) {
    fs.writeFileSync(configScriptPath, updated);
  }
}

if (fs.existsSync(autolinkingJsonPath)) {
  const original = fs.readFileSync(autolinkingJsonPath, 'utf8');
  const updated = original.replace(workspaceRootPattern, currentRoot);

  if (updated !== original) {
    fs.writeFileSync(autolinkingJsonPath, updated);
  }
}
EOF
fi

cd "${ROOT_DIR}"
"${ROOT_DIR}/scripts/ensure-local-api.sh"

if command -v pod >/dev/null 2>&1; then
  if launch_installed_dev_client; then
    exit 0
  fi

  if build_and_launch_with_xcode; then
    exit 0
  fi
fi

if launch_installed_dev_client; then
  exit 0
fi

if build_and_launch_with_xcode; then
  exit 0
fi

echo "CocoaPods CLI is unavailable and the Properavista app is not installed on the booted simulator." >&2
echo "Install CocoaPods or build the iOS app once from Xcode, then run this command again." >&2
exit 1