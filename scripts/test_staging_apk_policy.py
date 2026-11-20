import unittest
import copy
import json
import hashlib
import tempfile
from pathlib import Path
from staging_apk_policy import staging_identity, verify_staging_manifest, smoke_identity, verify_smoke_source, verify_smoke_input, parse_ui_hierarchy, verify_firebase_resources, verify_driver_signed_out_entry

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

class SignedSmokeSelectionTests(unittest.TestCase):
    def test_driver_entry_rejects_customer_paths_and_unauthenticated_controls(self):
        valid = '<hierarchy><node text="RoCoEats Driver · Driver access"/><node text="Sign in or create account in browser"/></hierarchy>'
        verify_driver_signed_out_entry(parse_ui_hierarchy(valid))
        for forbidden in ['Use a private guest link', 'Continue as Guest', 'Order as Guest', 'Go online', 'Administrator controls']:
            with self.assertRaises(AssertionError):
                verify_driver_signed_out_entry(parse_ui_hierarchy(valid.replace('</hierarchy>', '<node text="'+forbidden+'"/></hierarchy>')))
        with self.assertRaises(AssertionError):
            verify_driver_signed_out_entry(parse_ui_hierarchy(valid.replace('RoCoEats Driver · Driver access', 'RoCoEats · Home')))

    def test_busy_or_missing_ui_capture_retries_without_claiming_app_failure(self):
        for raw in ['cat: /sdcard/rocoeats-qa.xml: No such file or directory\n', '', 'ERROR: could not get idle state', '<hierarchy', '<html/>']:
            self.assertIsNone(parse_ui_hierarchy(raw))
        root=parse_ui_hierarchy('<?xml version="1.0"?><hierarchy><node text="Sign in securely"/></hierarchy>')
        self.assertEqual(root.find('node').get('text'),'Sign in securely')

    def test_configured_firebase_requires_matching_compiled_app_and_project(self):
        config={'client':[{'client_info':{'android_client_info':{'package_name':'com.rocoeats.driver.staging'},'mobilesdk_app_id':'public-fixture-app'}}],'project_info':{'project_id':'public-fixture-project'}}
        resources='google_app_id public-fixture-app project_id public-fixture-project'
        verify_firebase_resources(resources,config,'com.rocoeats.driver.staging')
        for missing in ['google_app_id','public-fixture-app','project_id','public-fixture-project']:
            with self.assertRaises(AssertionError):verify_firebase_resources(resources.replace(missing,''),config,'com.rocoeats.driver.staging')
        with self.assertRaises(AssertionError):verify_firebase_resources(resources,config,'com.rocoeats.app.staging')

    def source(self, audience):
        sha = 'a' * 40
        run = {'id': 42, 'conclusion':'success', 'status':'completed', 'event':'workflow_dispatch',
               'path':'.github/workflows/native-validation.yml', 'head_sha':sha,
               'repository':{'id':1,'full_name':'owner/repo'}, 'head_repository':{'full_name':'owner/repo'}}
        artifact = {'name':smoke_identity(audience)['artifact'], 'expired':False,
                    'workflow_run':{'id':42,'head_sha':sha,'head_repository_id':1}}
        return run, {'artifacts':[artifact]}

    def test_both_audiences_use_fixed_distinct_packages_and_files(self):
        for audience in ('customer','driver'):
            run, artifacts = self.source(audience)
            app = verify_smoke_source(run, artifacts, audience, 'owner/repo')
            self.assertEqual(app['source'], 'a'*40)
            self.assertEqual(app['package'],staging_identity(audience)['package'])
            self.assertEqual(app['activity'].split('/')[1], 'com.rocoeats.app.MainActivity')
        self.assertNotEqual(smoke_identity('driver')['artifact'],smoke_identity('customer')['artifact'])
        with self.assertRaises(ValueError): smoke_identity('admin; echo unsafe')

    def test_reject_failed_pending_wrong_workflow_fork_or_invalid_source(self):
        for field,value in [('conclusion','failure'),('status','in_progress'),('event','pull_request'),
                            ('path','.github/workflows/untrusted.yml'),('head_sha','../../payload')]:
            run, artifacts = self.source('driver');run[field]=value
            with self.assertRaises(AssertionError):verify_smoke_source(run, artifacts,'driver','owner/repo')
        run,artifacts=self.source('driver');run['head_repository']['full_name']='fork/repo'
        with self.assertRaises(AssertionError):verify_smoke_source(run, artifacts,'driver','owner/repo')

    def test_reject_missing_duplicate_expired_cross_audience_or_mismatched_artifact(self):
        run,artifacts=self.source('driver')
        for artifact_list in [[], artifacts['artifacts']*2, self.source('customer')[1]['artifacts']]:
            with self.assertRaises(AssertionError):verify_smoke_source(run,{'artifacts':artifact_list},'driver','owner/repo')
        for field,value in [('id',43),('head_sha','b'*40),('head_repository_id',9)]:
            invalid=copy.deepcopy(artifacts);invalid['artifacts'][0]['workflow_run'][field]=value
            with self.assertRaises(AssertionError):verify_smoke_source(run,invalid,'driver','owner/repo')
        artifacts['artifacts'][0]['expired']=True
        with self.assertRaises(AssertionError):verify_smoke_source(run,artifacts,'driver','owner/repo')

    def test_input_enforces_exact_source_audience_bytes_and_checksum_paths(self):
        for audience in ('customer','driver'):
            with tempfile.TemporaryDirectory() as directory:
                root=Path(directory);app=smoke_identity(audience);sha='a'*40
                identity={'name':app['name'],'package':app['package'],'source':sha}
                (root/'APP_IDENTITY.json').write_text(json.dumps(identity))
                (root/app['apk']).write_bytes(b'original APK fixture')
                checksum=hashlib.sha256(b'original APK fixture').hexdigest()+'  '+app['apk']+'\n'
                (root/'SHA256SUMS.txt').write_text(checksum)
                self.assertEqual(verify_smoke_input(root,audience,sha)['source'],sha)
                with self.assertRaises(AssertionError):verify_smoke_input(root,audience,'b'*40)
                (root/'SHA256SUMS.txt').write_text(checksum+'0'*64+'  ../secret\n')
                with self.assertRaises(AssertionError):verify_smoke_input(root,audience,sha)
                (root/'SHA256SUMS.txt').write_text(checksum)
                (root/app['apk']).write_bytes(b'changed APK')
                with self.assertRaises(AssertionError):verify_smoke_input(root,audience,sha)
                (root/app['apk']).unlink();(root/app['apk']).symlink_to(root/'APP_IDENTITY.json')
                with self.assertRaises(AssertionError):verify_smoke_input(root,audience,sha)

if __name__ == '__main__': unittest.main()
