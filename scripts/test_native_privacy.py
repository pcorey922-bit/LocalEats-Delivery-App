import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('native_privacy', Path(__file__).with_name('verify-native-privacy.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class NativePrivacyTests(unittest.TestCase):
    def test_exported_service_and_customer_permission_expansion_are_rejected(self):
        source = f'''<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION"/><uses-permission android:name="android.permission.POST_NOTIFICATIONS"/><application><service android:name="{module.SERVICE}" android:exported="false" android:foregroundServiceType="location"/></application></manifest>'''
        module.verify_android(source, True)
        for value in ('8', '0x8', '0x00000008'):
            module.verify_android(source.replace('foregroundServiceType="location"', f'foregroundServiceType="{value}"'), True)
        for value in ('', 'dataSync', 'camera', '4', '0x18'):
            with self.assertRaises(AssertionError): module.verify_android(source.replace('foregroundServiceType="location"', f'foregroundServiceType="{value}"'), True)
        with self.assertRaises(AssertionError): module.verify_android(source.replace('exported="false"', 'exported="true"'), True)
        with self.assertRaises(AssertionError): module.verify_android(source, False)
        module.verify_android('<manifest><application/></manifest>', False)

    def test_driver_and_customer_ios_permissions_stay_distinct(self):
        customer = {'CFBundleIdentifier': 'com.rocoeats.app'}
        driver = {**customer, 'UIBackgroundModes': ['location'], 'NSLocationAlwaysAndWhenInUseUsageDescription': 'On-duty location sharing with consent'}
        module.verify_ios(customer, False)
        module.verify_ios(driver, True)
        with self.assertRaises(AssertionError): module.verify_ios(customer, True)
        with self.assertRaises(AssertionError): module.verify_ios(driver, False)

if __name__ == '__main__': unittest.main()
