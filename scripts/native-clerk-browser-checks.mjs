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
 console.log('PASS: native-session notification receive/tap and simultaneous foreground listeners refresh the real local account-scoped inbox, ignore payload routes, clear old identity data and preserve sign-out. Native events/SDK mocked; no provider registration, sends or hosted writes.');
 console.log('PASS: native SDK principal drives Driver/admin workspace and account/navigation/restart without Web Clerk; real local API denies wrong/unapproved role; native restore failure is actionable/retryable; existing handoff consumes one simulated native ticket. SDK/OS/provider simulated, no hosted/provider operation.');
}
