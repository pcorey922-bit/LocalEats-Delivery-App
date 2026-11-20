import importlib.util
import json
import plistlib
import struct
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('ios_smoke', Path(__file__).with_name('ios-simulator-smoke.py'))
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)
DEVICE = '11111111-2222-4333-8444-555555555555'
INVENTORY = {'runtimes': [{'identifier': 'com.apple.CoreSimulator.SimRuntime.iOS-18-0', 'version': '18.0', 'isAvailable': True}], 'devicetypes': [{'identifier': 'com.apple.CoreSimulator.SimDeviceType.iPhone-16', 'minRuntimeVersion': 18 << 16, 'maxRuntimeVersion': 0xffffffff}, {'identifier': 'com.apple.CoreSimulator.SimDeviceType.iPhone-future', 'minRuntimeVersion': 99 << 16}]}


class SmokeTests(unittest.TestCase):
    def fixture(self, root, audience='driver'):
        app = root / 'App.app'
        (app / 'public').mkdir(parents=True)
        config = json.loads((smoke.ROOT / 'config/native-staging.json').read_text())
        expected = json.loads((smoke.ROOT / 'config/native-audiences.json').read_text())[audience]
        (app / 'Info.plist').write_bytes(plistlib.dumps({'CFBundleIdentifier': expected['id'], 'CFBundleDisplayName': expected['name'], 'CFBundleExecutable': 'App', 'CFBundleURLTypes': [{'CFBundleURLSchemes': [expected['scheme']]}]}))
        (app / 'App').write_bytes(b'not-a-real-binary')
        (app / 'public' / 'fixture.js').write_text(json.dumps(config))
        return app

    def runner(self, calls, fail=None):
        def run(stage, args, timeout=45):
            calls.append((stage, args))
            if stage == fail:
                raise smoke.SmokeFailure(stage)
            if stage == 'simulator_inventory':
                return json.dumps(INVENTORY)
            if stage == 'create_simulator':
                return DEVICE
            if stage.endswith('_launch'):
                return 'com.rocoeats.driver: 12345\n'
            if stage.endswith('_process_alive'):
                return '/Devices/' + DEVICE + '/Containers/Bundle/Application/fixture/App.app/App'
            if stage.endswith('_screen_content'):
                return json.dumps({'uiVerified': True, 'expectedEntryDetected': True})
            if stage.endswith('_screenshot'):
                Path(args[-1]).write_bytes(b'\x89PNG\r\n\x1a\n' + bytes(8) + struct.pack('>II', 390, 844))
            return ''
        return run

    def test_both_audiences_install_launch_restart_and_cleanup_only_created_device(self):
        for audience in ('customer', 'driver'):
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                calls, pauses = [], []
                report = smoke.run_smoke(self.fixture(root, audience), audience, 'a' * 40, root / 'report', self.runner(calls), pauses.append)
                self.assertTrue(report['completed'])
                self.assertEqual(pauses, [35, 35])
                self.assertFalse(report['authenticatedSessionTested'])
                self.assertFalse(report['physicalDeviceTested'])
                self.assertFalse(report['financialOperationsPerformed'])
                self.assertEqual(calls[-1][1], ['xcrun', 'simctl', 'delete', DEVICE])
                self.assertFalse(any(any(word in args for word in ['openurl', 'privacy', 'push', 'erase', 'all']) for _, args in calls))

    def test_wrong_identity_or_missing_staging_assets_never_creates_device(self):
        for mode in ('wrong_identity', 'missing_assets'):
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                app, calls = self.fixture(root), []
                if mode == 'wrong_identity':
                    info = plistlib.loads((app / 'Info.plist').read_bytes()); info['CFBundleIdentifier'] = 'foreign.app'; (app / 'Info.plist').write_bytes(plistlib.dumps(info))
                else:
                    (app / 'public' / 'fixture.js').write_text('unconfigured')
                with self.assertRaises(smoke.SmokeFailure):
                    smoke.run_smoke(app, 'driver', 'a' * 40, root / 'report', self.runner(calls), lambda _: None)
                self.assertEqual(calls, [])

    def test_boot_install_or_process_failure_still_deletes_only_owned_simulator(self):
        for stage in ('boot_ready', 'install', 'cold_process_alive', 'restart_process_alive'):
            with tempfile.TemporaryDirectory() as directory:
                root, calls = Path(directory), []
                with self.assertRaises(smoke.SmokeFailure):
                    smoke.run_smoke(self.fixture(root), 'driver', 'a' * 40, root / 'report', self.runner(calls, stage), lambda _: None)
                report = json.loads((root / 'report/report.json').read_text())
                self.assertFalse(report['completed']); self.assertEqual(report['failureStage'], stage)
                self.assertEqual(calls[-1][1], ['xcrun', 'simctl', 'delete', DEVICE])

    def test_inconclusive_bootstatus_requires_owned_booted_device_and_real_install_checks(self):
        for state in ('Booted', 'Shutdown'):
            with tempfile.TemporaryDirectory() as directory:
                root, calls = Path(directory), []
                original = self.runner(calls, 'boot_ready')
                def run(stage, args, timeout=45):
                    if stage == 'verify_booted_device':
                        return json.dumps({'devices': {'runtime': [{'udid': DEVICE, 'state': state, 'isAvailable': True}]}})
                    return original(stage, args, timeout)
                if state == 'Booted':
                    report = smoke.run_smoke(self.fixture(root), 'driver', 'a' * 40, root / 'report', run, lambda _: None)
                    self.assertTrue(report['completed'])
                    self.assertEqual(report['bootCompletionSignal'], 'booted_state_then_install_and_launch')
                    self.assertTrue(any(stage == 'install' for stage, _ in calls))
                else:
                    with self.assertRaises(smoke.SmokeFailure):
                        smoke.run_smoke(self.fixture(root), 'driver', 'a' * 40, root / 'report', run, lambda _: None)
                    self.assertFalse(any(stage == 'install' for stage, _ in calls))

    def test_live_process_does_not_accept_a_startup_error_screen(self):
        with tempfile.TemporaryDirectory() as directory:
            root, calls = Path(directory), []
            original = self.runner(calls)
            def run(stage, args, timeout=45):
                if stage == 'restart_screen_content':
                    return json.dumps({'uiVerified': False, 'startupErrorDetected': True})
                return original(stage, args, timeout)
            with self.assertRaises(smoke.SmokeFailure):
                smoke.run_smoke(self.fixture(root, 'customer'), 'customer', 'a' * 40, root / 'report', run, lambda _: None)
            report = json.loads((root / 'report/report.json').read_text())
            self.assertFalse(report['completed'])
            self.assertEqual(report['failureStage'], 'restart_screen_content')
            self.assertTrue(report['screens']['restart']['startupErrorDetected'])
            self.assertEqual(calls[-1][1], ['xcrun', 'simctl', 'delete', DEVICE])

    def test_runtime_selection_rejects_unavailable_or_incompatible_without_downloading(self):
        self.assertEqual(smoke.select_device(INVENTORY)[1], 'com.apple.CoreSimulator.SimDeviceType.iPhone-16')
        with self.assertRaises(smoke.SmokeFailure):
            smoke.select_device({'runtimes': [], 'devicetypes': []})
        with self.assertRaises(smoke.SmokeFailure):
            smoke.select_device({**INVENTORY, 'devicetypes': INVENTORY['devicetypes'][1:]})


if __name__ == '__main__':
    unittest.main()
