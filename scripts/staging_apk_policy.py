"""Pure checks shared by the existing APK verifier and its offline regressions."""
import json
from pathlib import Path
import re

def staging_identity(audience='customer'):
    if audience not in ('customer', 'driver'): raise ValueError('Unknown native audience')
    app = json.loads((Path(__file__).resolve().parent.parent / 'config/native-audiences.json').read_text())[audience]
    return {**app, 'package': app['id'] + '.staging'}

def verify_staging_manifest(manifest, audience='customer'):
    app = staging_identity(audience)
    assert re.search(r'\bpackage="' + re.escape(app['package']) + r'"', manifest), 'Wrong staging package'
    for flag in ('debuggable', 'usesCleartextTraffic', 'allowBackup'):
        assert re.search(r'android:' + flag + r'[^\n]*0xffffffff', manifest) is None, 'Unsafe staging manifest flag'
    for permission in ('ACCESS_BACKGROUND_LOCATION', 'READ_SMS', 'SEND_SMS', 'READ_CONTACTS', 'READ_PHONE_STATE', 'REQUEST_INSTALL_PACKAGES', 'SYSTEM_ALERT_WINDOW', 'QUERY_ALL_PACKAGES', 'MANAGE_EXTERNAL_STORAGE'):
        assert 'android.permission.' + permission not in manifest, 'Unexpected sensitive permission rejected'
    if audience == 'customer':
        assert 'BackgroundGeolocationService' not in manifest and 'android.permission.FOREGROUND_SERVICE_LOCATION' not in manifest, 'Customer background tracking must remain absent'
    return app

if __name__ == '__main__':
    import sys
    verify_staging_manifest(Path(sys.argv[2]).read_text(), sys.argv[1])
    print('Compiled staging package identity and security flags verified.')


def smoke_identity(audience='customer'):
    app = staging_identity(audience)
    prefix = 'RoCoEats-Driver' if audience == 'driver' else 'RoCoEats'
    return {**app, 'audience': audience,
            'activity': app['package'] + '/com.rocoeats.app.MainActivity',
            'artifact': prefix + '-Android-Staging-Test-APK',
            'apk': prefix + '-Android-Staging-Test.apk'}


def verify_smoke_source(run, artifacts, audience, repository):
    """Accept only a successful, same-repository protected packaging workflow."""
    app = smoke_identity(audience)
    assert type(run.get('id')) is int and run['id'] > 0, 'Invalid source run ID'
    assert type(run.get('repository', {}).get('id')) is int and run['repository']['id'] > 0, 'Invalid repository ID'
    assert run.get('conclusion') == 'success' and run.get('status') == 'completed', 'Source run did not succeed'
    assert run.get('event') == 'workflow_dispatch', 'Expected protected manual packaging run'
    assert run.get('path') == '.github/workflows/native-validation.yml', 'Wrong source workflow'
    assert run.get('repository', {}).get('full_name') == repository, 'Wrong repository'
    assert run.get('head_repository', {}).get('full_name') == repository, 'Fork source rejected'
    sha = run.get('head_sha', '')
    assert isinstance(sha, str) and re.fullmatch(r'[a-f0-9]{40}', sha), 'Invalid source SHA'
    selected = [a for a in artifacts.get('artifacts', []) if a.get('name') == app['artifact']]
    assert len(selected) == 1, 'Expected one exact audience artifact'
    artifact = selected[0]
    assert artifact.get('expired') is False, 'Artifact expired'
    source = artifact.get('workflow_run', {})
    assert source.get('id') == run.get('id') and source.get('head_sha') == sha, 'Artifact source mismatch'
    assert source.get('head_repository_id') == run.get('repository', {}).get('id'), 'Artifact fork source rejected'
    return {**app, 'source': sha, 'run': run['id']}


def verify_smoke_input(directory, audience, source):
    """Check exact selected bytes and identity before APK installation; no shell paths."""
    import hashlib
    directory = Path(directory)
    app = smoke_identity(audience)
    assert isinstance(source, str) and re.fullmatch(r'[a-f0-9]{40}', source), 'Invalid source SHA'
    for name in (app['apk'], 'SHA256SUMS.txt', 'APP_IDENTITY.json'):
        path = directory / name
        assert path.is_file() and not path.is_symlink(), 'Missing or unsafe artifact file'
    identity = json.loads((directory / 'APP_IDENTITY.json').read_text())
    assert identity == {'package': app['package'], 'name': app['name'], 'source': source}, 'Packaged source/audience mismatch'
    sums = (directory / 'SHA256SUMS.txt').read_text()
    match = re.fullmatch(r'([a-f0-9]{64})  ' + re.escape(app['apk']) + r'\n?', sums)
    assert match, 'Expected exact APK checksum entry, without extra paths'
    assert hashlib.sha256((directory / app['apk']).read_bytes()).hexdigest() == match[1], 'APK digest mismatch'
    return {**app, 'source': source}


def parse_ui_hierarchy(raw):
    """An early/busy uiautomator dump may not exist yet; never parse shell errors as XML."""
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(raw)
        return root if root.tag == 'hierarchy' else None
    except ET.ParseError:
        return None


def verify_firebase_resources(resources, config, package):
    selected = config['client'][0]
    assert selected['client_info']['android_client_info']['package_name'] == package, 'Firebase client package mismatch'
    assert 'google_app_id' in resources and selected['client_info']['mobilesdk_app_id'] in resources, 'Compiled Firebase app resource missing'
    assert 'project_id' in resources and config['project_info']['project_id'] in resources, 'Compiled Firebase project resource missing'


def verify_driver_signed_out_entry(root):
    """Dedicated driver entry must stay signed out and contain no customer paths."""
    text = ' '.join(n.get('text', '') + ' ' + n.get('content-desc', '') for n in root.iter('node')).casefold()
    for expected in ['RoCoEats Driver', 'Driver access', 'Sign in or create account in browser']:
        assert expected.casefold() in text, 'Expected driver sign-in navigation missing'
    for forbidden in ['Continue as Guest', 'Use a private guest link', 'Order as Guest', 'Go online', 'Go offline', 'Administrator controls', 'Enable background location for this session']:
        assert forbidden.casefold() not in text, 'Signed-out driver entry exposed a foreign or authenticated control'


def verify_customer_home(root):
    """Actual approved homepage, never the legacy shell navigation or recovery UI."""
    text = ' '.join(n.get('text', '') + ' ' + n.get('content-desc', '') for n in root.iter('node')).casefold()
    for expected in ['Good food', 'Sign In', 'Browse Restaurants & Menus']:
        assert expected.casefold() in text, 'Expected customer homepage control missing'
    assert 'native_startup_timeout' not in text and 'app startup did not finish' not in text, 'Customer startup recovery replaced homepage'


def native_callback_diagnostics(activities, logs, package, scheme):
    """Fixed booleans only: no raw Android intents, URLs, account or log content."""
    return {
        'coldAuthIntentVisible': any(package in line and scheme+'://auth' in line for line in activities.splitlines()),
        'webMessageErrorObserved': bool(re.search(r'WebMessage|postMessage|JavaScriptReplyProxy', logs, re.I)),
        'nativeBridgeReplyErrorObserved': 'sendResponseMessage: error' in logs,
        'nativeBridgeThreadErrorObserved': bool(re.search(r'wrongthread|UI thread|main thread', logs, re.I)),
        'pluginErrorObserved': bool(re.search(r'not implemented|Unable to load plugin|Unable to execute plugin', logs, re.I)),
        'nativeCrashObserved': any('Process: '+package+',' in block for block in logs.split('FATAL EXCEPTION:')[1:]),
    }


def emulator_infrastructure_failure(root):
    """Recognize the known OS launcher blocker; never classify app-owned text."""
    for node in root.iter('node'):
        if node.get('package') == 'android' and re.search(r'launcher.*(?:isn.t responding|not responding)', node.get('text', ''), re.I):
            return 'system_launcher_unresponsive'
    return None


def capture_ui_dump(shell, adb):
    """A killed/unfinished OS capture is unavailable evidence, never an app pass.
    The caller's existing bounded wait loop decides when to retry. Do not retain
    subprocess output: it can contain arbitrary OS/application strings.
    """
    import subprocess
    try:
        shell('rm', '-f', '/sdcard/rocoeats-qa.xml')
        shell('uiautomator', 'dump', '--compressed', '/sdcard/rocoeats-qa.xml')
        raw = adb('exec-out', 'cat', '/sdcard/rocoeats-qa.xml').decode(errors='replace')
        return raw, None
    except subprocess.CalledProcessError as error:
        return '', 'ui_capture_exit_' + str(error.returncode)
    except subprocess.TimeoutExpired:
        return '', 'ui_capture_timeout'
