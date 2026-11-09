#!/usr/bin/env bash
# Disposable CI emulator only. Never run against an attached physical phone.
set -euo pipefail
: "${ANDROID_HOME:?}"
: "${RUNNER_TEMP:?}"
if [[ ! -e /dev/kvm || ! -r /dev/kvm || ! -w /dev/kvm ]]; then
 echo 'Hardware virtualization unavailable to this runner; cannot certify emulator launch.' >&2
 exit 1
fi
export ANDROID_AVD_HOME="$RUNNER_TEMP/rocoeats-qa-avd"
mkdir -p "$ANDROID_AVD_HOME"
printf 'no\n' | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd --force --name RoCoEatsQA --package 'system-images;android-35;google_apis;x86_64' --device pixel_7
"$ANDROID_HOME/emulator/emulator" -avd RoCoEatsQA -no-window -no-audio -no-snapshot -no-boot-anim -gpu swiftshader_indirect -memory 2048 > "$RUNNER_TEMP/rocoeats-emulator.log" 2>&1 &
emulator_pid=$!
trap 'adb -e emu kill >/dev/null 2>&1 || true; kill "$emulator_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 100); do
 if [[ "$(adb -e shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == '1' ]]; then
  adb -e shell input keyevent 82
  python3 scripts/android-staging-smoke.py
  exit $?
 fi
 kill -0 "$emulator_pid" 2>/dev/null || { echo 'Emulator exited before boot.' >&2; exit 1; }
 sleep 3
done
echo 'Emulator boot deadline exceeded.' >&2
exit 1
