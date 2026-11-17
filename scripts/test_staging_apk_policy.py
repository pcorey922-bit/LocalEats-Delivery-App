import unittest
from staging_apk_policy import staging_identity, verify_staging_manifest

class StagingApkPolicyTests(unittest.TestCase):
    def test_customer_default_stays_stable_and_wrong_audience_is_rejected(self):
        customer = 'A: package="com.rocoeats.app.staging"\n'
        self.assertEqual(verify_staging_manifest(customer)['package'], 'com.rocoeats.app.staging')
        self.assertEqual(staging_identity('driver')['package'], 'com.rocoeats.driver.staging')
        with self.assertRaises(AssertionError): verify_staging_manifest(customer, 'driver')
        with self.assertRaises(ValueError): staging_identity('admin')

    def test_driver_variant_never_relaxes_staging_backup_cleartext_or_sensitive_permissions(self):
        driver = 'A: package="com.rocoeats.driver.staging"\n'
        verify_staging_manifest(driver, 'driver')
        for audience, source in [('driver', driver), ('customer', driver.replace('.driver.', '.app.'))]:
            for unsafe in ['android:debuggable(0x01)=0xffffffff', 'android:allowBackup(0x01)=0xffffffff', 'android:usesCleartextTraffic(0x01)=0xffffffff', 'android.permission.READ_SMS']:
                with self.assertRaises(AssertionError): verify_staging_manifest(source + unsafe, audience)

if __name__ == '__main__': unittest.main()
