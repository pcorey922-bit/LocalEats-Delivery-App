#!/usr/bin/env bash
# Disposable CI emulator only. Never run against an attached physical phone.
set -euo pipefail
: "${ANDROID_HOME:?}"
: "${RUNNER_TEMP:?}"
mkdir -p android-smoke-evidence
if [[ ! -e /dev/kvm || ! -r /dev/kvm || ! -w /dev/kvm ]]; then
 echo 'Hardware virtualization unavailable to this runner; cannot certify emulator launch.' >&2
 exit 1
fi
"$ANDROID_HOME/emulator/emulator" -accel-check | tee android-smoke-evidence/acceleration.txt
export ANDROID_AVD_HOME="$RUNNER_TEMP/rocoeats-qa-avd"
mkdir -p "$ANDROID_AVD_HOME"
printf 'no\n' | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd --force --name RoCoEatsQA --package 'system-images;android-35;google_apis;x86_64' --device pixel_7
"$ANDROID_HOME/emulator/emulator" -avd RoCoEatsQA -no-window -no-audio -no-snapshot -no-boot-anim -gpu swiftshader_indirect -feature -Vulkan -accel on -cores 2 -camera-back none -camera-front none -memory 3072 > "$RUNNER_TEMP/rocoeats-emulator.log" 2>&1 &
emulator_pid=$!
cleanup() {
 cp "$RUNNER_TEMP/rocoeats-emulator.log" android-smoke-evidence/emulator-boot.log || true
 timeout 10s adb -e shell getprop sys.boot_completed > android-smoke-evidence/boot-completed.txt 2>&1 || true
 timeout 10s adb -e emu kill >/dev/null 2>&1 || true
 kill "$emulator_pid" 2>/dev/null || true
}
trap cleanup EXIT
boot_deadline=$((SECONDS+480))
while (( SECONDS < boot_deadline )); do
 if [[ "$(timeout 10s adb -e shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == '1' ]]; then
  adb -e shell input keyevent KEYCODE_WAKEUP
  adb -e shell wm dismiss-keyguard
  adb -e shell settings put system screen_off_timeout 600000
  adb -e shell input keyevent 82
  python3 scripts/android-staging-smoke.py
  exit $?
 fi
 kill -0 "$emulator_pid" 2>/dev/null || { echo 'Emulator exited before boot.' >&2; exit 1; }
 sleep 3
done
echo 'Emulator boot deadline exceeded; inspect emulator-boot.log. No app result is claimed.' >&2
exit 1
