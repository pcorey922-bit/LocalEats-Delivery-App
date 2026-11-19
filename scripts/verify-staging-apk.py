"""Review packaged public assets; never print matched credential values."""
import json,re,subprocess,sys,zipfile,hashlib,pathlib,os
from staging_apk_policy import verify_staging_manifest, verify_firebase_resources
apk=pathlib.Path(sys.argv[1]); tools=pathlib.Path(sys.argv[2]); report=pathlib.Path(sys.argv[3])
signature=subprocess.check_output([str(tools/'apksigner'),'verify','--verbose','--print-certs',str(apk)],text=True)
print(signature)
manifest=subprocess.check_output([str(tools/'aapt2'),'dump','xmltree',str(apk),'--file','AndroidManifest.xml'],text=True)
app=verify_staging_manifest(manifest,os.environ.get('ROCOEATS_NATIVE_AUDIENCE','customer'))
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
firebase_configured = os.environ.get('ROCOEATS_FIREBASE_ANDROID_CONFIGURED') == 'true'
if firebase_configured:
 client_config=json.loads(pathlib.Path('artifacts/localeats/android/app/google-services.json').read_text())
 resources=subprocess.check_output([str(tools/'aapt2'),'dump','resources',str(apk)],text=True)
 verify_firebase_resources(resources,client_config,app['package'])
report.mkdir(parents=True,exist_ok=True)
(report/'android-manifest-review.txt').write_text(manifest)
(report/'signing-certificate.txt').write_text(signature)
(report/'SHA256SUMS.txt').write_text(hashlib.sha256(apk.read_bytes()).hexdigest()+'  '+apk.name+'\n')
(report/'APP_IDENTITY.json').write_text(json.dumps({'package':app['package'],'name':app['name'],'source':os.environ.get('GITHUB_SHA','unverified-local-source')},indent=2)+'\n')
(report/'BUILD_READINESS.txt').write_text('Signed non-debuggable staging APK. Public configuration only. Static checks are not malware certification, Play Protect approval or physical-device verification. Ordering and payment authority remain on the server.\nFirebase Android client resources configured and verified: '+str(firebase_configured)+'. This does not verify provider credentials or actual delivery.\n')
