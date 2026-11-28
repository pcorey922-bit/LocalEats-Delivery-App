"""Black-box checks of the real signed APK on an isolated Android emulator.
No accounts, auth tickets, guest capabilities, orders or payments are supplied.
ADB is used only on this disposable CI emulator, never the owner's phone.
"""
import json,os,pathlib,re,subprocess,time,xml.etree.ElementTree as ET
from staging_apk_policy import verify_smoke_input, parse_ui_hierarchy, verify_driver_signed_out_entry, verify_customer_home, native_callback_diagnostics, emulator_infrastructure_failure, capture_ui_dump
audience=os.environ.get('ROCOEATS_SMOKE_AUDIENCE', 'customer')
app=verify_smoke_input('smoke-input',audience,os.environ['ROCOEATS_SMOKE_SOURCE'])
package=app['package']
activity=app['activity']
scheme=app['scheme']
output=pathlib.Path('android-smoke-evidence');output.mkdir(exist_ok=True)
results=[]
runtime_permissions={}
completed=False
callback_diagnostics={}
infrastructure_failure=None
class EmulatorInfrastructureError(AssertionError):
 pass
def adb(*args,timeout=30):
 return subprocess.check_output([os.environ['ROCOEATS_QA_ADB'],'-e',*args],timeout=timeout,stderr=subprocess.STDOUT)
def shell(*args,timeout=30):return adb('shell',*args,timeout=timeout).decode(errors='replace')
def snapshot(name):
 xml,capture=capture_ui_dump(shell,adb)
 root=parse_ui_hierarchy(xml)
 try:(output/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
 except subprocess.SubprocessError:pass
 if root is None:
  (output/(name+'.capture.txt')).open('a').write((capture or 'ui_capture_invalid_xml')+'\n')
 else:
  (output/(name+'.xml')).write_text(xml)
 return root
def labels(root):return ' '.join(n.get('text','')+' '+n.get('content-desc','') for n in root.iter('node'))
def wait_text(name,expected,attempts=18):
 text=''
 captured=False
 for _ in range(attempts):
  root=snapshot(name)
  if root is None:
   time.sleep(2);continue
  failure=emulator_infrastructure_failure(root)
  if failure:
   global infrastructure_failure
   infrastructure_failure=failure
   raise EmulatorInfrastructureError('Emulator infrastructure blocked UI: '+failure)
  captured=True;text=labels(root)
  if 'Something went wrong' in text or 'NATIVE_STARTUP_TIMEOUT' in text:raise AssertionError('Application error boundary or startup recovery appeared; inspect anonymous screenshot')
  if expected.casefold() in text.casefold():return root
  time.sleep(2)
 print('Anonymous emulator UI: '+re.sub(r'https?://\S+','[URL]',text)[:1000],flush=True)
 raise AssertionError(('Expected UI did not appear: '+expected) if captured else 'UI hierarchy capture unavailable; inspect capture.txt and screenshot; no app acceptance claimed')
def tap(root,text):
 candidates=[n for n in root.iter('node') if text in [n.get('text',''),n.get('content-desc','')]]
 assert candidates,'UI control missing: '+text
 node=next((n for n in candidates if n.get('clickable')=='true'),candidates[0])
 values=list(map(int,re.findall(r'\d+',node.get('bounds',''))));assert len(values)==4,'UI bounds missing'
 shell('input','tap',str((values[0]+values[2])//2),str((values[1]+values[3])//2))
def mark(name):
 results.append({'check':name,'passed':True});print('PASS: '+name,flush=True)
def launch(uri=None):
 args=['am','start','-W']
 if uri:args+=['-a','android.intent.action.VIEW','-d',uri,'-p',package]
 else:args+=['-n',activity]
 result=shell(*args);assert 'Error:' not in result,result
 shell('pidof',package)
def diagnose_customer_callback(already_launched=False):
 try:
  if not already_launched:
   shell('am','force-stop',package);launch(scheme+'://auth')
  activities=shell('dumpsys','activity','activities')
  logs=adb('logcat','-d','-s','Capacitor:E','Capacitor/Plugin:E','chromium:E','AndroidRuntime:E').decode(errors='replace')
  callback_diagnostics.update(native_callback_diagnostics(activities,logs,package,scheme))
  try:
   wait_text('callback-cold-diagnostic','Sign in or create account in browser',attempts=6)
   callback_diagnostics['coldProbeReachedSignIn']=True
  except EmulatorInfrastructureError:
   raise
  except AssertionError:
   callback_diagnostics['coldProbeReachedSignIn']=False
   root=snapshot('callback-cold-state')
   callback_diagnostics['coldStartupTimeoutObserved']=bool(root is not None and 'NATIVE_STARTUP_TIMEOUT' in labels(root))
  launch(scheme+'://auth')
  try:
   wait_text('callback-warm-diagnostic','Sign in or create account in browser',attempts=6)
   callback_diagnostics['warmAuthReachedSignIn']=True
  except EmulatorInfrastructureError:
   raise
  except AssertionError:
   callback_diagnostics['warmAuthReachedSignIn']=False
 except EmulatorInfrastructureError:
  callback_diagnostics['blockedByEmulatorInfrastructure']=True
 except (AssertionError,subprocess.SubprocessError,OSError):
  callback_diagnostics['diagnosticInterrupted']=True

def crash_check():
 logs=adb('logcat','-d','-s','AndroidRuntime:E').decode(errors='replace')
 for block in logs.split('FATAL EXCEPTION:')[1:]:
  assert 'Process: '+package+',' not in block,'Native app crash recorded'

try:
 adb('logcat','-c');adb('install','--no-streaming',str((pathlib.Path('smoke-input')/app['apk']).resolve()),timeout=90)
 mark('signed staging package installed on Android emulator')
 package_info=shell('dumpsys','package',package)
 for permission in ['ACCESS_FINE_LOCATION','ACCESS_COARSE_LOCATION','POST_NOTIFICATIONS']:
  matches=re.findall(r'android\.permission\.'+permission+r': granted=(true|false)',package_info)
  runtime_permissions[permission]=matches[-1] if matches else 'not present in runtime permission state'
  assert 'true' not in matches,'Runtime permission granted before user consent: '+permission
 mark('location and notification runtime permissions are not pre-granted')
 if audience=='driver':
  launch();root=wait_text('01-driver-launch','Sign in or create account in browser')
  verify_driver_signed_out_entry(root)
  mark('real signed driver app reaches driver-only secure signed-out entry')
  for name,uri in [('02-driver-cold-auth',scheme+'://auth'),('03-driver-order-link',scheme+'://orders'),('04-driver-untrusted-link',scheme+'://orders?role=admin'),('05-driver-malformed-link',scheme+'://auth/untrusted')]:
   shell('am','force-stop',package);launch(uri)
   root=wait_text(name,'Sign in or create account in browser')
   verify_driver_signed_out_entry(root)
   mark(name+' remains signed out without approval or role elevation')
  tap(root,'RoCoEats Driver · Driver access')
  root=wait_text('06-driver-navigation','Sign in or create account in browser')
  verify_driver_signed_out_entry(root)
  mark('driver entry navigation returns to secure sign-in without starting authentication')
  shell('am','force-stop',package);launch();wait_text('08-driver-relaunch','Sign in or create account in browser')
  mark('driver relaunch restores safe signed-out state; no account supplied')
 else:
  launch();root=wait_text('01-home','Browse Restaurants & Menus')
  time.sleep(35);root=wait_text('01-home-stable','Browse Restaurants & Menus');verify_customer_home(root)
  mark('real customer homepage survives startup deadline without recovery screen')
  tap(root,'Sign In');root=wait_text('02-sign-in','Sign in or create account in browser')
  tap(root,'Use a private guest link');root=wait_text('02-guest','Use a private guest link')
  mark('private guest recovery UI reachable without account')
  # Cold-start links must recover into native browser sign-in, not an embedded Google WebView.
  shell('am','force-stop',package);launch(scheme+'://auth')
  try:
   root=wait_text('03-cold-auth','Sign in or create account in browser')
  except AssertionError:
   diagnose_customer_callback(already_launched=True)
   raise
  mark('cold-start auth callback reaches system-browser sign-in control')
  launch(scheme+'://orders?role=admin')
  root=wait_text('04-untrusted-link','Sign in securely')
  mark('authority-bearing deep link cannot navigate into an account')
  tap(root,'Continue as Guest');root=wait_text('05-guest-checkout','Receipt email')
  mark('guest checkout contact form does not require registration')
  shell('am','force-stop',package);launch();wait_text('06-relaunch','Browse Restaurants & Menus')
  time.sleep(35);root=wait_text('06-relaunch-stable','Browse Restaurants & Menus');verify_customer_home(root)
  mark('customer relaunch survives startup deadline without recovery screen')
 crash_check();mark('no native application crash found');completed=True
except AssertionError as failure:
 if audience=='customer' and not callback_diagnostics and not isinstance(failure,EmulatorInfrastructureError):
  callback_diagnostics['earlierAcceptanceFailed']=True
  diagnose_customer_callback()
 raise
finally:
 try:
  logs=adb('logcat','-d','-s','AndroidRuntime:E').decode(errors='replace')
  callback_diagnostics['finalNativeCrashObserved']=native_callback_diagnostics('',logs,package,scheme)['nativeCrashObserved']
 except subprocess.SubprocessError:callback_diagnostics['finalCrashEvidenceUnavailable']=True
 report={'completed':completed,'runtimePermissions':runtime_permissions,'callbackDiagnostics':callback_diagnostics,'infrastructureFailure':infrastructure_failure,'package':package,'source':app['source'],'audience':audience,'businessWritesPerformed':False,'emulator':True,'physicalSamsung':False,'playProtectVerified':False,'authenticatedSignInVerified':False,'paymentTested':False,'checks':results}
 (output/'results.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':len(results),'emulator':True,'physicalDeviceVerified':False}))
