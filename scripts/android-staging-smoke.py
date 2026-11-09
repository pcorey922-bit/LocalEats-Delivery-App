"""Black-box checks of the real signed APK on an isolated Android emulator.
No accounts, auth tickets, guest capabilities, orders or payments are supplied.
ADB is used only on this disposable CI emulator, never the owner's phone.
"""
import json,os,pathlib,re,subprocess,time,xml.etree.ElementTree as ET
package='com.rocoeats.app.staging'
activity=package+'/com.rocoeats.app.MainActivity'
output=pathlib.Path('android-smoke-evidence');output.mkdir(exist_ok=True)
results=[]
def adb(*args,timeout=30):
 return subprocess.check_output(['adb','-e',*args],timeout=timeout,stderr=subprocess.STDOUT)
def shell(*args,timeout=30):return adb('shell',*args,timeout=timeout).decode(errors='replace')
def snapshot(name):
 shell('uiautomator','dump','/sdcard/rocoeats-qa.xml')
 xml=adb('exec-out','cat','/sdcard/rocoeats-qa.xml').decode(errors='replace')
 (output/(name+'.xml')).write_text(xml)
 (output/(name+'.png')).write_bytes(adb('exec-out','screencap','-p'))
 return ET.fromstring(xml)
def labels(root):return ' '.join(n.get('text','')+' '+n.get('content-desc','') for n in root.iter('node'))
def wait_text(name,expected,attempts=18):
 for _ in range(attempts):
  root=snapshot(name);text=labels(root)
  if 'Something went wrong' in text:raise AssertionError('Application error boundary appeared; inspect anonymous screenshot')
  if expected.casefold() in text.casefold():return root
  time.sleep(2)
 raise AssertionError('Expected UI did not appear: '+expected)
def tap(root,text):
 candidates=[n for n in root.iter('node') if text in [n.get('text',''),n.get('content-desc','')]]
 assert candidates,'UI control missing: '+text
 node=next((n for n in candidates if n.get('clickable')=='true'),candidates[0])
 values=list(map(int,re.findall(r'\d+',node.get('bounds',''))));assert len(values)==4,'UI bounds missing'
 shell('input','tap',str((values[0]+values[2])//2),str((values[1]+values[3])//2))
def mark(name):results.append({'check':name,'passed':True})
def launch(uri=None):
 args=['am','start','-W']
 if uri:args+=['-a','android.intent.action.VIEW','-d',uri,'-p',package]
 else:args+=['-n',activity]
 result=shell(*args);assert 'Error:' not in result,result
 shell('pidof',package)
def crash_check():
 logs=adb('logcat','-d','-s','AndroidRuntime:E').decode(errors='replace')
 for block in logs.split('FATAL EXCEPTION:')[1:]:
  assert 'Process: '+package+',' not in block,'Native app crash recorded'
mark('emulator-only test; no Samsung/Play Protect certification')
try:
 adb('logcat','-c');adb('install','--no-streaming',str(pathlib.Path('smoke-input/RoCoEats-Android-Staging-Test.apk').resolve()),timeout=90)
 mark('signed staging package installed on Android emulator')
 launch();root=wait_text('01-launch','RoCoEats');root=wait_text('01-home','Find food')
 mark('real packaged application launched and rendered')
 tap(root,'Guest order');root=wait_text('02-guest','Use a private guest link')
 mark('private guest recovery UI reachable without account')
 # Cold-start links must recover into native browser sign-in, not an embedded Google WebView.
 shell('am','force-stop',package);launch('rocoeats://auth')
 root=wait_text('03-cold-auth','Sign in or create account in browser')
 mark('cold-start auth callback reaches system-browser sign-in control')
 launch('rocoeats://orders?role=admin')
 root=wait_text('04-untrusted-link','Sign in securely')
 mark('authority-bearing deep link cannot navigate into an account')
 tap(root,'Continue as Guest');root=wait_text('05-guest-checkout','Receipt email')
 mark('guest checkout contact form does not require registration')
 shell('am','force-stop',package);launch();wait_text('06-relaunch','Find food')
 mark('application relaunch succeeds')
 crash_check();mark('no native application crash found')
finally:
 report={'package':package,'emulator':True,'physicalSamsung':False,'playProtectVerified':False,'authenticatedSignInVerified':False,'paymentTested':False,'checks':results}
 (output/'results.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':len(results),'emulator':True,'physicalDeviceVerified':False}))
