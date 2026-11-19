import { readNativeRequest } from './native-auth-request';
import { mobileReturnRoute, mobileCallbackRoute } from "./mobile-return";
import { readGuestToken } from "./guest-session";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type PushEnrollment = { signal?: AbortSignal; promise: Promise<void>; cancel: () => void };
let registration: PushEnrollment | null = null;
export function cancelPushRegistration() { registration?.cancel(); }
export function registerPush(options: { signal?: AbortSignal } = {}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.reject(new Error('Mobile push enrollment requires the Android or iOS app. In-app notifications remain available.'));
  if (options.signal?.aborted) return Promise.reject(options.signal.reason);
  if (registration?.signal === options.signal && registration) return registration.promise;
  registration?.cancel();
  const controller = new AbortController(), signal = controller.signal;
  const cancel = () => controller.abort(new Error('Push registration canceled because the account or screen changed. Retry while signed in.'));
  options.signal?.addEventListener('abort', cancel, {once:true});
  const handles: Array<{remove: () => Promise<void>}> = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort!: () => void;
  const stopped = new Promise<never>((_,reject) => {
    rejectAbort = () => reject(signal.reason);
    signal.addEventListener('abort',rejectAbort,{once:true});
  });
  const keep = async (pending: Promise<{remove: () => Promise<void>}>) => {
    const handle = await pending;
    if (signal.aborted) { void handle.remove().catch(()=>{}); signal.throwIfAborted(); }
    handles.push(handle);
  };
  const work = (async () => {
    signal.throwIfAborted();
    const config = await customFetch<{android:boolean;ios:boolean}>('/api/notification-devices/config',{signal});
    signal.throwIfAborted();
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    if (!config[platform]) throw new Error('Mobile push needs external service configuration. In-app notifications are available.');
    const permission = await PushNotifications.requestPermissions();
    signal.throwIfAborted();
    if (permission.receive !== 'granted') throw new Error('Notification permission was not granted');
    const appId = (await App.getInfo()).id;
    signal.throwIfAborted();
    timer = setTimeout(() => controller.abort(new Error('Device registration timed out. Registration is unconfirmed; retry or disable push for this device.')),15000);
    let resolveToken!: () => void, rejectToken!: (error:unknown) => void, claimed = false;
    const received = new Promise<void>((resolve,reject) => {resolveToken=resolve;rejectToken=reject;});
    // May abort while native listener creation itself is still pending.
    void received.catch(()=>{});
    const abortToken = () => rejectToken(signal.reason);
    signal.addEventListener('abort',abortToken,{once:true});
    try {
      await keep(PushNotifications.addListener('registration', token => {
        if (signal.aborted || claimed) return;
        claimed = true;
        void (async () => {
          signal.throwIfAborted();
          // Retain a revocation handle BEFORE the request: a lost response is
          // unconfirmed enrollment, not proof the server did not commit it.
          localStorage.setItem('rocoeats-push-pending-token',token.value);
          const result = await customFetch<{deviceId?:string}>('/api/notification-devices',{
            method:'POST',signal,body:JSON.stringify({token:token.value,platform,appId}),
          });
          signal.throwIfAborted();
          localStorage.setItem('rocoeats-push-token',token.value);
          if (result.deviceId) localStorage.setItem('rocoeats-push-device-id',result.deviceId);
          else localStorage.removeItem('rocoeats-push-device-id');
          if (localStorage.getItem('rocoeats-push-pending-token')===token.value) localStorage.removeItem('rocoeats-push-pending-token');
          resolveToken();
        })().catch(rejectToken);
      }));
      await keep(PushNotifications.addListener('registrationError', () => rejectToken(new Error('Native push registration failed. Check Firebase/APNs setup.'))));
      signal.throwIfAborted();
      await Promise.all([PushNotifications.register(),received]);
    } finally { signal.removeEventListener('abort',abortToken); }
  })();
  let active: PushEnrollment;
  const promise = Promise.race([work,stopped]).finally(() => {
    controller.abort(new Error('Push registration ended. Retry if enrollment is unconfirmed.'));
    if (timer) clearTimeout(timer);
    options.signal?.removeEventListener('abort',cancel);
    signal.removeEventListener('abort',rejectAbort);
    for (const handle of handles) void handle.remove().catch(()=>{});
    if (registration === active) registration = null;
  });
  active = {signal:options.signal,promise,cancel}; registration=active;
  return promise;
}
export async function unregisterPush() {
  cancelPushRegistration();
  const token = localStorage.getItem("rocoeats-push-token");
  const deviceId = localStorage.getItem('rocoeats-push-device-id');
  const pendingToken = localStorage.getItem('rocoeats-push-pending-token');
  // A device that was never enrolled may have no Firebase app configuration.
  if (!token && !deviceId && !pendingToken) return;
  let failure: unknown;
  for (const target of [deviceId ? {deviceId} : token ? {token} : null, pendingToken ? {token:pendingToken} : null]) {
    if (!target) continue;
    try { await customFetch('/api/notification-devices',{method:'DELETE',body:JSON.stringify(target)}); }
    catch (error) { failure ??= error; }
  }
  // Do not clear the saved registration when the server could not revoke it.
  // This retains an explicit retry instead of reporting a false opt-out.
  try { if (Capacitor.isNativePlatform()) await PushNotifications.unregister(); }
  catch (error) { failure ??= error; }
  if (!failure) {
    localStorage.removeItem("rocoeats-push-token");
    localStorage.removeItem('rocoeats-push-device-id');
    localStorage.removeItem('rocoeats-push-pending-token');
  }
  if (failure) throw failure;
}
export function MobileLifecycle() {
  const {isSignedIn}=useAuth();
  const signedIn=useRef(isSignedIn);signedIn.current=isSignedIn;
  const [, navigate] = useLocation();
  const client = useQueryClient();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];
    const retain = async (
      promise: Promise<{ remove: () => Promise<void> }>,
    ) => {
      try {
        const handle = await promise;
        if (disposed) await handle.remove();
        else handles.push(handle);
      } catch {
        // A missing optional native/push capability must not reject app startup.
        // Permission/configuration and actual push receipt are reported separately.
      }
    };
    void retain(
      App.addListener("appStateChange", (state) => {
        if (state.isActive) void client.invalidateQueries();
      }),
    );
    const returnToApp=async(raw:string)=>{
      const audience=import.meta.env.VITE_APP_AUDIENCE === 'driver' ? 'driver' : 'customer';
      const hasGuest=!!readGuestToken()&&!signedIn.current;
      if (!mobileReturnRoute(raw,hasGuest,audience)) return;
      // Native dismissal can fail or never settle. It is not an auth prerequisite.
      void Browser.close().catch(()=>{}); if(disposed)return;
      const route=mobileCallbackRoute(raw,hasGuest,audience,!!signedIn.current,!!readNativeRequest());
      if(route) navigate(route); void client.invalidateQueries();
    };
    void retain(App.addListener("appUrlOpen",event=>returnToApp(event.url)));
    void App.getLaunchUrl().then(result=>{if(result&&!disposed)void returnToApp(result.url);}).catch(()=>{});
    void retain(
      PushNotifications.addListener(
        "pushNotificationReceived",
        () => void client.invalidateQueries({ queryKey: ["notifications"] }),
      ),
    );
    void retain(
      PushNotifications.addListener("pushNotificationActionPerformed", () => {
        navigate("/notifications");
        void client.invalidateQueries();
      }),
    );
    return () => {
      disposed = true;
      for (const handle of handles) void handle.remove();
    };
  }, [client, navigate]);
  return null;
}
