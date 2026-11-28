import assert from 'node:assert/strict';
// Real UI + disposable local API/DB. Native SDK/Clerk/OS are explicitly simulated.
export async function verifyNativeClerkDriver({actor,api,origin,ids,seedInbox}){
 async function native(role){const page=await actor(role);await page.context().addInitScript(()=>{window.qaNativeBootstrap=true;window.qaProviderBlocked=true;});return page;}
 const owner=await native('admin');await owner.goto(origin);
 await owner.getByText(/Administrator delivery workspace/).waitFor();await owner.getByRole('button',{name:'Go online',exact:true}).waitFor();
 assert.ok(await owner.evaluate(()=>window.qaNativeSdkReads>0));assert.equal(await owner.evaluate(()=>window.qaWebTokenCalls||0),0,'Native app must not call browser Clerk token getter');
 await owner.getByRole('button',{name:'Menu',exact:true}).click();await owner.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Account',exact:true}).click();
 await owner.getByTestId('text-clerk-user-id').waitFor();assert.ok((await owner.getByTestId('text-clerk-user-id').innerText()).length>0);
 await owner.reload();await owner.getByTestId('page-account').waitFor();assert.equal(await owner.evaluate(()=>window.qaNativeTicketCalls||0),0,'SDK-restored session needs no repeated browser approval');
 const denied=await native('otherCustomer');await denied.goto(origin+'/driver');await denied.getByText('Sign in with an active, administrator-approved driver profile to view deliveries.',{exact:true}).waitFor();assert.equal(await denied.getByRole('button',{name:'Go online',exact:true}).count(),0);assert.equal((await api('otherCustomer','/profiles/me')).role,'customer');
 const pending=await native('unapprovedDriver');await pending.goto(origin+'/driver');assert.equal(await pending.getByRole('button',{name:'Go online',exact:true}).isDisabled(),true);
 const broken=await native('driver');await broken.context().addInitScript(()=>{window.qaNativeStateFailure=true;});await broken.goto(origin+'/driver');await broken.getByRole('alert').filter({hasText:'NATIVE_AUTH_RESTORE_FAILED'}).waitFor();
 await broken.evaluate(()=>{window.qaNativeStateFailure=false;});await broken.getByRole('button',{name:'Retry session',exact:true}).click();await broken.getByRole('button',{name:'Go online',exact:true}).waitFor();
 const handoff=await native('admin');await handoff.context().addInitScript(()=>{if(!sessionStorage.getItem('qa-native-bootstrap-done')){sessionStorage.setItem('qa-native-signed-out','1');sessionStorage.setItem('qa-native-bootstrap-done','1')}});
 await handoff.route('**/api/mobile/auth/start',route=>route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({id:'11111111-1111-4111-8111-111111111111',expiresAt:new Date(Date.now()+120000).toISOString(),authorizationUrl:'https://localeats-delivery-app.onrender.com/mobile/authorize#simulated'})}));
 await handoff.route('**/api/mobile/auth/redeem',route=>route.fulfill({status:200,contentType:'application/json',body:'{"ticket":"simulated-native-ticket"}'}));
 await handoff.goto(origin+'/sign-in?join=driver');await handoff.getByRole('button',{name:'Sign in or create account in browser',exact:true}).click();await handoff.getByText(/Administrator delivery workspace/).waitFor();
 assert.equal(await handoff.evaluate(()=>window.qaNativeTicketCalls),1);assert.equal(await handoff.evaluate(()=>window.qaWebTokenCalls||0),0);
 await handoff.reload();await handoff.getByText(/Administrator delivery workspace/).waitFor();assert.equal(await handoff.evaluate(()=>window.qaNativeTicketCalls||0),0,'Reload restores native SDK, never reconsumes ticket');

 const inbox=await native('admin');await seedInbox('admin','Owner private inbox fixture');await seedInbox('driver','Driver private inbox fixture');
 await inbox.goto(origin+'/notifications');await inbox.getByText('Provider sending is disabled. Your in-app inbox remains available.',{exact:true}).waitFor();assert.equal(await inbox.getByText('App identity could not be checked.',{exact:false}).count(),0);await inbox.getByRole('heading',{name:'Owner private inbox fixture',exact:true}).waitFor();
 assert.equal(await inbox.getByRole('heading',{name:'Driver private inbox fixture',exact:true}).count(),0);
 await seedInbox('admin','New foreground notification fixture');
 await inbox.evaluate(()=>window.qaPushListeners.pushNotificationReceived({notification:{data:{route:'/admin',url:'https://untrusted.invalid'}}}));
 await inbox.getByRole('heading',{name:'New foreground notification fixture',exact:true}).waitFor({timeout:3000});
 assert.equal(new URL(inbox.url()).pathname,'/notifications','Payload cannot choose an arbitrary route');
 await inbox.goto(origin+'/driver');await inbox.getByRole('button',{name:'Go online',exact:true}).waitFor();
 await inbox.evaluate(()=>window.qaPushListeners.pushNotificationActionPerformed({notification:{data:{route:'/admin',orderId:'untrusted'}}}));
 await inbox.getByRole('heading',{name:'Owner private inbox fixture',exact:true}).waitFor();
 await inbox.evaluate(id=>{window.qaUserId=id;window.qaAppListeners.appStateChange({isActive:true})},ids.driver);
 await inbox.getByRole('heading',{name:'Driver private inbox fixture',exact:true}).waitFor();
 assert.equal(await inbox.getByRole('heading',{name:'Owner private inbox fixture',exact:true}).count(),0,'Foreground identity change clears prior private inbox');
 await inbox.evaluate(()=>{sessionStorage.setItem('qa-native-signed-out','1');window.qaAppListeners.appStateChange({isActive:true})});
 await inbox.getByRole('button',{name:'Sign in or create account in browser',exact:true}).waitFor();
 await inbox.evaluate(()=>window.qaPushListeners.pushNotificationActionPerformed({notification:{data:{route:'/driver'}}}));
 await inbox.getByRole('button',{name:'Sign in or create account in browser',exact:true}).waitFor();
 assert.equal(await inbox.getByRole('heading',{name:'Driver private inbox fixture',exact:true}).count(),0,'A delayed tap cannot restore a signed-out inbox');
 assert.equal(await inbox.evaluate(()=>window.qaPushPermissionRequests||0),0,'Receiving/tapping never requests permission or enrolls a device');

 const rotation=await native('admin'),original='old_rotation_fixture_token',rotated='new_rotation_fixture_token';
 const device=await api('admin','/notification-devices','POST',{platform:'android',appId:'com.rocoeats.driver.staging',token:original});
 await rotation.context().addInitScript(({id,token})=>{localStorage.setItem('rocoeats-push-device-id',id);localStorage.setItem('rocoeats-push-token',token);localStorage.setItem('rocoeats-push-consent','true');window.qaPushPermissionGranted=true;window.qaAllowNativeRegister=true;window.qaNativePushToken=token},{id:device.deviceId,token:original});
 await rotation.route('**/api/notification-devices/config',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({android:true,ios:false,deliveryEnabled:false,tokenRefreshVersion:1})}));
 let updates=0;rotation.on('request',request=>{if(request.method()==='PUT'&&request.url().includes('/notification-devices/'))updates++});
 const firstRefresh=rotation.waitForResponse(response=>response.url().endsWith('/notification-devices/'+device.deviceId)&&response.request().method()==='PUT'&&response.status()===200);
 await rotation.goto(origin+'/notifications');await firstRefresh;
 const refreshed=rotation.waitForResponse(response=>response.url().endsWith('/notification-devices/'+device.deviceId)&&response.request().method()==='PUT'&&response.request().postDataJSON().token===rotated&&response.status()===200);
 await rotation.evaluate(value=>{window.qaNativePushToken=value;window.qaPushListeners.registration({value})},rotated);await refreshed;
 assert.equal((await api('admin','/notification-devices','POST',{platform:'android',appId:'com.rocoeats.driver.staging',token:rotated})).deviceId,device.deviceId,'Rotation preserves the same server enrollment');
 await rotation.getByRole('button',{name:'Disable push for this device',exact:true}).click();await rotation.getByRole('status').filter({hasText:'Push registration removed'}).waitFor();
 assert.equal(await rotation.evaluate(()=>window.qaPushPermissionRequests||0),0,'Existing-consent rotation cannot prompt for permission');
 const stopped=updates,registrations=await rotation.evaluate(()=>window.qaRegisterCalls);
 await rotation.evaluate(()=>{window.qaPushListeners.registration({value:'late_rotation_fixture_token'});window.qaAppListeners.appStateChange({isActive:true})});
 assert.equal(await rotation.evaluate(()=>localStorage.getItem('rocoeats-push-opted-out')),'true');assert.equal(await rotation.evaluate(()=>localStorage.getItem('rocoeats-push-consent')),null);
 assert.equal(updates,stopped);assert.equal(await rotation.evaluate(()=>window.qaRegisterCalls),registrations,'Explicit opt-out cannot be undone by foreground recovery');
 await rotation.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();await rotation.getByRole('status').filter({hasText:'This device is registered to your current account'}).waitFor();
 assert.equal(await rotation.evaluate(()=>localStorage.getItem('rocoeats-push-opted-out')),null);assert.equal(await rotation.evaluate(()=>localStorage.getItem('rocoeats-push-consent')),'true');

 await rotation.evaluate(()=>window.qaPushListeners.registrationError({error:'synthetic provider error'}));
 const refreshError=rotation.getByRole('alert').filter({hasText:'Device token update is unconfirmed'});await refreshError.waitFor();
 const repaired=rotation.waitForResponse(response=>response.request().method()==='PUT'&&response.url().includes('/notification-devices/')&&response.status()===200);
 await rotation.evaluate(()=>{window.qaNativePushToken='recovered_rotation_fixture_token';window.qaPushListeners.registration({value:window.qaNativePushToken})});await repaired;await refreshError.waitFor({state:'hidden'});

 await rotation.evaluate(()=>{window.qaOriginalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='rocoeats-push-opted-out')throw new DOMException('Synthetic quota failure','QuotaExceededError');return window.qaOriginalStorageSet.call(this,key,value)}});
 const removals=await rotation.evaluate(()=>window.qaUnregisterCalls||0);await rotation.getByRole('button',{name:'Disable push for this device',exact:true}).click();await rotation.waitForFunction(count=>(window.qaUnregisterCalls||0)>count,removals);
 assert.equal(await rotation.evaluate(()=>localStorage.getItem('rocoeats-push-consent')),null,'Quota failure must still remove existing consent');
 const noWrites=updates,noRegister=await rotation.evaluate(()=>window.qaRegisterCalls);
 await rotation.evaluate(()=>{window.qaPushListeners.registration({value:'quota_late_token_fixture'});window.qaAppListeners.appStateChange({isActive:true});Storage.prototype.setItem=window.qaOriginalStorageSet});
 assert.equal(updates,noWrites);assert.equal(await rotation.evaluate(()=>window.qaRegisterCalls),noRegister);
 await rotation.getByRole('button',{name:'Disable push for this device',exact:true}).click();await rotation.getByRole('status').filter({hasText:'Push registration removed'}).waitFor();
 console.log('PASS: simulated provider token rotation refreshes the actual authorized local enrollment without replacing its ID; opt-out blocks late events/foreground registration; only explicit re-enrollment restores consent. No provider sends.');
 console.log('PASS: native-session notification receive/tap and simultaneous foreground listeners refresh the real local account-scoped inbox, ignore payload routes, clear old identity data and preserve sign-out. Native events/SDK mocked; no provider registration, sends or hosted writes.');
 console.log('PASS: native SDK principal drives Driver/admin workspace and account/navigation/restart without Web Clerk; real local API denies wrong/unapproved role; native restore failure is actionable/retryable; existing handoff consumes one simulated native ticket. SDK/OS/provider simulated, no hosted/provider operation.');
}
