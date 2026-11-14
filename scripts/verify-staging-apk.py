"""Review packaged public assets; never print matched credential values."""
import json,re,subprocess,sys,zipfile,hashlib,pathlib,os
apk=pathlib.Path(sys.argv[1]); tools=pathlib.Path(sys.argv[2]); report=pathlib.Path(sys.argv[3])
signature=subprocess.check_output([str(tools/'apksigner'),'verify','--verbose','--print-certs',str(apk)],text=True)
print(signature)
manifest=subprocess.check_output([str(tools/'aapt2'),'dump','xmltree',str(apk),'--file','AndroidManifest.xml'],text=True)
assert 'com.rocoeats.app.staging' in manifest, 'Wrong staging package'
assert re.search(r'android:debuggable[^\n]*0xffffffff',manifest) is None,'Debuggable testing package rejected'
assert re.search(r'android:usesCleartextTraffic[^\n]*0xffffffff',manifest) is None,'Cleartext rejected'
assert re.search(r'android:allowBackup[^\n]*0xffffffff',manifest) is None,'Backup rejected'
for permission in ['ACCESS_BACKGROUND_LOCATION','READ_SMS','SEND_SMS','READ_CONTACTS','READ_PHONE_STATE','REQUEST_INSTALL_PACKAGES','SYSTEM_ALERT_WINDOW','QUERY_ALL_PACKAGES','MANAGE_EXTERNAL_STORAGE']:
 assert 'android.permission.'+permission not in manifest,'Unexpected sensitive permission rejected'
config=json.loads(pathlib.Path('config/native-staging.json').read_text())
found_origin=found_key=False
patterns=[rb'(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{20,}',rb'whsec_[A-Za-z0-9]{20,}',rb'postgres(?:ql)?://[^\s"\x27<>]{3,}',rb'-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----']
with zipfile.ZipFile(apk) as z:
 for item in z.infolist():
  name=item.filename
  assert not re.search(r'(?:^|/)(?:\.env(?:\.|$)|[^/]+\.(?:p12|jks|keystore|p8)$)',name,re.I),'Credential file packaged'
  data=z.read(item)
  password=os.environ.get('ROCOEATS_STAGING_KEYSTORE_PASSWORD','')
  assert not password or password.encode() not in data,'Signing credential packaged'
  assert not any(re.search(p,data) for p in patterns),'Possible secret found in packaged assets; review privately'
  found_origin |= config['apiOrigin'].encode() in data
  found_key |= config['clerkPublishableKey'].encode() in data
assert found_origin and found_key,'Actual staging origin or public Clerk key missing'
report.mkdir(parents=True,exist_ok=True)
(report/'android-manifest-review.txt').write_text(manifest)
(report/'signing-certificate.txt').write_text(signature)
(report/'SHA256SUMS.txt').write_text(hashlib.sha256(apk.read_bytes()).hexdigest()+'  '+apk.name+'\n')
(report/'BUILD_READINESS.txt').write_text('Signed non-debuggable staging APK. Public configuration only. Static checks are not malware certification, Play Protect approval or physical-device verification. Ordering and payment authority remain on the server.\n')
