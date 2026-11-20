"""Optional signed-out process smoke on an ephemeral CI simulator; no UI actions."""
import hashlib
import json
import os
import plistlib
import re
import struct
import subprocess
import sys
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class SmokeFailure(Exception):
    def __init__(self, stage):
        self.stage = stage
        super().__init__(stage)


def version_score(version):
    parts = [int(p) for p in str(version).split('.')]
    parts = (parts + [0, 0])[:3]
    return (parts[0] << 16) + (parts[1] << 8) + parts[2]


def select_device(inventory):
    runtimes = sorted((r for r in inventory['runtimes'] if r.get('isAvailable') is True and r['identifier'].startswith('com.apple.CoreSimulator.SimRuntime.iOS-')), key=lambda r: version_score(r['version']), reverse=True)
    for runtime in runtimes:
        score = version_score(runtime['version'])
        types = [d for d in inventory['devicetypes'] if d['identifier'].startswith('com.apple.CoreSimulator.SimDeviceType.iPhone-') and d.get('minRuntimeVersion', 0) <= score <= d.get('maxRuntimeVersion', 0xffffffff)]
        if types:
            selected = max(types, key=lambda d: (d.get('minRuntimeVersion', 0), d['identifier']))
            return runtime['identifier'], selected['identifier']
    raise SmokeFailure('available_ios_runtime')


def execute(stage, args, timeout=45):
    try:
        return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout).stdout
    except (OSError, subprocess.SubprocessError):
        # Never echo arbitrary app/provider console output or environment values.
        raise SmokeFailure(stage) from None


def run_smoke(app, audience, source, output, run=execute, pause=time.sleep):
    output.mkdir(parents=True, exist_ok=True)
    report = {'audience': audience, 'source': source, 'completed': False, 'checks': [], 'authenticatedSessionTested': False, 'physicalDeviceTested': False, 'uiInputActionsPerformed': False, 'permissionActionsPerformed': False, 'providerDeliveryTested': False, 'financialOperationsPerformed': False}
    device = None
    failure = None
    try:
        if audience not in ('customer', 'driver') or not re.fullmatch('[a-f0-9]{40}', source):
            raise SmokeFailure('source_identity')
        expected = json.loads((ROOT / 'config/native-audiences.json').read_text())[audience]
        config = json.loads((ROOT / 'config/native-staging.json').read_text())
        info = plistlib.loads((app / 'Info.plist').read_bytes())
        schemes = [scheme for item in info.get('CFBundleURLTypes', []) for scheme in item.get('CFBundleURLSchemes', [])]
        executable = info.get('CFBundleExecutable', '')
        if info.get('CFBundleIdentifier') != expected['id'] or info.get('CFBundleDisplayName') != expected['name'] or schemes != [expected['scheme']] or not re.fullmatch('[A-Za-z0-9_.-]+', executable):
            raise SmokeFailure('compiled_identity')
        if app.is_symlink() or not app.name.endswith('.app') or not (app / executable).is_file():
            raise SmokeFailure('compiled_bundle')
        assets = list((app / 'public').rglob('*.js'))
        contents = [p.read_bytes() for p in assets if not p.is_symlink()]
        if not contents or not all(any(value.encode() in data for data in contents) for value in config.values()):
            raise SmokeFailure('public_staging_configuration')
        report.update({'package': expected['id'], 'name': expected['name'], 'scheme': expected['scheme'], 'apiOrigin': config['apiOrigin'], 'executableSha256': hashlib.sha256((app / executable).read_bytes()).hexdigest()})
        report['checks'].append('compiled_identity_and_public_staging_configuration')
        runtime, device_type = select_device(json.loads(run('simulator_inventory', ['xcrun', 'simctl', 'list', '--json'])))
        created = run('create_simulator', ['xcrun', 'simctl', 'create', 'RoCoEats-QA-' + audience, device_type, runtime]).strip()
        try:
            device = str(uuid.UUID(created)).upper()
        except ValueError:
            raise SmokeFailure('created_device_identity') from None
        report['runtime'] = runtime
        run('boot', ['xcrun', 'simctl', 'boot', device])
        try:
            run('boot_ready', ['xcrun', 'simctl', 'bootstatus', device, '-b'], timeout=180)
            report['bootCompletionSignal'] = 'bootstatus'
        except SmokeFailure:
            # An inconclusive bootstatus wait is not proof of readiness.
            # Require this OWN device to report Booted, then the real bounded
            # install/launch checks. Never extend the wait or infer UI acceptance.
            try:
                inventory = json.loads(run('verify_booted_device', ['xcrun', 'simctl', 'list', 'devices', '--json']))
                booted = any(d.get('udid', '').upper() == device and d.get('state') == 'Booted' and d.get('isAvailable') is True for items in inventory['devices'].values() for d in items)
            except (SmokeFailure, ValueError, KeyError, TypeError):
                booted = False
            if not booted:
                raise SmokeFailure('boot_ready')
            report['bootCompletionSignal'] = 'booted_state_then_install_and_launch'

        run('install', ['xcrun', 'simctl', 'install', device, str(app.resolve())], timeout=60)
        report['checks'].append('installed')
        for phase in ('cold', 'restart'):
            launched = run(phase + '_launch', ['xcrun', 'simctl', 'launch', '--terminate-running-process', device, expected['id']])
            match = re.search(r':\s*([1-9][0-9]*)\s*$', launched)
            if not match:
                raise SmokeFailure(phase + '_process_identity')
            pause(35)
            command = run(phase + '_process_alive', ['ps', '-p', match[1], '-o', 'command='])
            if device.lower() not in command.lower() or '/' + app.name + '/' + executable not in command:
                raise SmokeFailure(phase + '_process_identity')
            screenshot = output / (phase + '.png')
            run(phase + '_screenshot', ['xcrun', 'simctl', 'io', device, 'screenshot', str(screenshot)])
            data = screenshot.read_bytes()
            if data[:8] != b'\x89PNG\r\n\x1a\n' or len(data) < 24 or min(struct.unpack('>II', data[16:24])) == 0:
                raise SmokeFailure(phase + '_screenshot')
            report['checks'].append(phase + '_launch_process_survived_35_seconds_and_screenshot')
            run(phase + '_terminate', ['xcrun', 'simctl', 'terminate', device, expected['id']])
    except SmokeFailure as error:
        failure = error
    except (OSError, ValueError, KeyError, TypeError):
        failure = SmokeFailure('invalid_bundle_or_runtime_evidence')
    finally:
        if device:
            # Delete ONLY the device created by this call. Never erase/delete all.
            for stage, verb in [('shutdown_created_simulator', 'shutdown'), ('delete_created_simulator', 'delete')]:
                try:
                    run(stage, ['xcrun', 'simctl', verb, device], timeout=60)
                except SmokeFailure:
                    failure = failure or SmokeFailure(stage)
        report['completed'] = failure is None
        if failure:
            report['failureStage'] = failure.stage
        report['limits'] = 'Process survival and screenshots only. UI rendering needs screenshot review; no authentication, GPS, push, delivery lifecycle, signing or physical acceptance inferred.'
        (output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    if failure:
        raise failure
    return report


if __name__ == '__main__':
    try:
        if len(sys.argv) != 4:
            raise SmokeFailure('arguments')
        result = run_smoke(Path(sys.argv[1]), sys.argv[2], os.environ.get('GITHUB_SHA', ''), Path(sys.argv[3]))
        print('PASS iOS simulator installation/cold-launch/restart process checks; review screenshots. No physical/auth/provider acceptance claim.')
    except SmokeFailure as error:
        print('iOS simulator smoke failed at ' + error.stage + '; inspect sanitized report.', file=sys.stderr)
        sys.exit(1)
