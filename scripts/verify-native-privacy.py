"""Verify compiled app permission boundaries; no device, credential or network I/O."""
import argparse
import plistlib
import xml.etree.ElementTree as ET

ANDROID = '{http://schemas.android.com/apk/res/android}'
SERVICE = 'com.equimaps.capacitor_background_geolocation.BackgroundGeolocationService'

def verify_android(source, driver):
    root = ET.fromstring(source)
    service = next((item for item in root.findall('./application/service') if item.get(ANDROID + 'name') == SERVICE), None)
    permissions = {item.get(ANDROID + 'name') for item in root.findall('uses-permission')}
    if driver:
        assert service is not None and service.get(ANDROID + 'exported') == 'false', 'Background service must be app-private'
        assert service.get(ANDROID + 'foregroundServiceType') == 'location', 'Location foreground service type required'
        assert 'android.permission.FOREGROUND_SERVICE_LOCATION' in permissions
        assert 'android.permission.POST_NOTIFICATIONS' in permissions
    else:
        assert service is None, 'Customer app must not include driver background service'
        assert 'android.permission.FOREGROUND_SERVICE_LOCATION' not in permissions

def verify_ios(info, driver):
    modes = info.get('UIBackgroundModes', [])
    if driver:
        assert 'location' in modes and info.get('NSLocationAlwaysAndWhenInUseUsageDescription'), 'Explicit background location purpose required'
    else:
        assert 'location' not in modes and 'NSLocationAlwaysAndWhenInUseUsageDescription' not in info, 'Customer background location must remain absent'

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('platform', choices=['android', 'ios'])
    parser.add_argument('audience', choices=['customer', 'driver'])
    parser.add_argument('file')
    args = parser.parse_args()
    with open(args.file, 'rb') as source:
        if args.platform == 'ios': verify_ios(plistlib.load(source), args.audience == 'driver')
        else: verify_android(source.read(), args.audience == 'driver')
    print('Compiled native permission boundary verified; no provider/device operation performed.')
