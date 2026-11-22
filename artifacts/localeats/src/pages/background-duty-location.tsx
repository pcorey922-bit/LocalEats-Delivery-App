import { driverDutyRequest } from '../lib/driver-duty-transport';
import { useAuth } from '@clerk/react';
import { dutyIntent } from '../lib/duty-intent';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { nativeDutyBridge as watcher, recordDutyStage, type DutyTraceKind } from '../lib/native-duty-diagnostics';
import { backgroundDutySession } from '../lib/background-duty';
import { customFetch } from '../../../../lib/api-client-react/src/custom-fetch';

const storageKey = 'rocoeats-background-watch:v1'; // Watch ID only, never a token or position.
let cleanup = Promise.resolve();
function clearSavedWatcher() {
  cleanup = cleanup.catch(() => {}).then(async () => {
    const id = localStorage.getItem(storageKey);
    if (!id) return;
    await watcher.removeWatcher({ id });
    if (localStorage.getItem(storageKey) === id) localStorage.removeItem(storageKey);
  });
  return cleanup;
}

export function BackgroundDutyRecovery() {
  const {isLoaded,isSignedIn,userId}=useAuth();
  const previousUser=useRef<string|null|undefined>(undefined);
  useEffect(()=>{
    if(!isLoaded)return;
    if((isSignedIn===false || previousUser.current!==undefined && previousUser.current!==(userId??null)) && Capacitor.getPlatform()==='android' && import.meta.env.VITE_APP_AUDIENCE==='driver') {
      try{void watcher.clearDutyDiagnostics().catch(()=>{});}catch{}
    }
    previousUser.current=userId??null;
  },[isLoaded,isSignedIn,userId]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (import.meta.env.VITE_APP_AUDIENCE !== 'driver' || !Capacitor.isNativePlatform()) return;
    void clearSavedWatcher().catch(() => setError('Previous location service could not stop. Disable location permission in device settings before reconnecting.'));
  }, []);
  return error ? <aside className="roco-alert" role="alert">{error}</aside> : null;
}

export function BackgroundDutyLocation({ onFatal }: { onFatal: (message: string) => void }) {
  const client = useQueryClient();
  const {userId, getToken} = useAuth();
  const tokenGetter = useRef(getToken); tokenGetter.current=getToken;
  const [message, setMessage] = useState('Starting background location with your permission…');
  useEffect(() => {
    let disposed = false, permissionDenied = false;
    let nativeId:string|undefined;
    const session = backgroundDutySession({ watcher: {
      addWatcher: async (options, callback) => {
        await clearSavedWatcher();
        const id = await watcher.addWatcher(options, (fix, error) => {
          const pulse = fix as unknown as {dutyPulse?:boolean; sequence?:unknown} | undefined;
          if (pulse?.dutyPulse === true && typeof pulse.sequence === 'string') {recordDutyStage(nativeId,'JS_PULSE','HEARTBEAT');callback(undefined, error, {sequence:pulse.sequence});}
          else {if(fix)recordDutyStage(nativeId,'JS_GPS','GPS');callback(fix && fix.time !== null ? { latitude: fix.latitude, longitude: fix.longitude, accuracy: fix.accuracy, time: fix.time, simulated: fix.simulated } : undefined, error);}
        });
        nativeId=id;
        try { localStorage.setItem(storageKey, id); }
        catch (error) { await watcher.removeWatcher({ id }); throw error; }
        return id;
      },
      ...(Capacitor.getPlatform() === 'android' ? {acknowledgeDuty:(id:string,sequence:string)=>watcher.acknowledgeDuty({id,sequence})} : {}),
      removeWatcher: async ({ id }) => { await watcher.removeWatcher({ id }); if (localStorage.getItem(storageKey) === id) localStorage.removeItem(storageKey); },
    }, api: (path,options)=> {
      const kind:DutyTraceKind=path.endsWith('/heartbeat')?'HEARTBEAT':path.endsWith('/availability')?'AVAILABILITY':'GPS';
      return driverDutyRequest(customFetch,()=>tokenGetter.current({skipCache:true}),path,{...options,onStage:stage=>recordDutyStage(nativeId,stage,kind)});
    },
      evidence: value => { if (!disposed && userId) dutyIntent.record(userId,value); },
      permission: async () => {
        if (Capacitor.getPlatform() !== 'android') return true;
        const permission = await PushNotifications.requestPermissions();
        if (!disposed) void client.invalidateQueries({queryKey:['push-permission']});
        if (permission.receive !== 'granted') {
          permissionDenied = true;
          if (!disposed) onFatal('Android notification permission is required for background sharing. Open phone Settings → Apps → RoCoEats Driver Staging → Notifications and allow notifications, then reconnect and enable background sharing again.');
          return false;
        }
        return true;
      },
      status: value => { if (!disposed) setMessage(value); },
      fatal: value => { if (!disposed) onFatal(value); },
    });
    void session.start().catch(() => { if (!disposed && !permissionDenied) onFatal('Background location could not start. Check location and notification permissions, then reconnect explicitly.'); });
    return () => { disposed = true; void session.stop().catch(() => onFatal('Location service could not stop. Disable location permission in device settings and reopen RoCoEats.')); };
  }, [onFatal, client, userId]);
  return <section aria-label="Background driver location"><p role="status">{message}</p><p>Sharing continues while this session remains authorized, including while the app is backgrounded. Authorized participants in your active delivery can also view your shared position. Android shows an ongoing notification; iOS shows its location indicator. Going offline stops sharing. A restart or expired session requires explicit reconnect. Keep your device charged.</p></section>;
}
