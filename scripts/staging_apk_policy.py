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
