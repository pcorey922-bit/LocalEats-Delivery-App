import {useEffect,useSyncExternalStore,type ReactNode} from 'react';
import {nativeStartup} from './native-startup';
import {useQueryClient} from '@tanstack/react-query';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {useAuth as webAuth,useUser as webUser,useClerk as webClerk,useSignIn as webSignIn} from '@clerk/react';
import {createNativeClerkStore,type NativeClerkBridge} from './native-clerk-store';
import {dutyIntent} from './duty-intent';
// Stable build/platform choice. Website, Customer and iOS keep existing Clerk.
export const usesNativeClerk=()=>import.meta.env?.VITE_NATIVE_DRIVER_AUTH==='true'&&import.meta.env.VITE_APP_AUDIENCE==='driver'&&Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='android';
export const nativeClerk=createNativeClerkStore(registerPlugin<NativeClerkBridge>('RoCoEatsNativeClerk'));
const useNativeSnapshot=()=>useSyncExternalStore(nativeClerk.subscribe,nativeClerk.getSnapshot,nativeClerk.getSnapshot);
export function useAuth(){
 // The branch is invariant for the lifetime of this app, never an account choice.
 if(!usesNativeClerk())return webAuth();
 const value=useNativeSnapshot();return{...value,getToken:nativeClerk.getToken};
}
export function useUser(){
 if(!usesNativeClerk())return webUser();
 const value=useNativeSnapshot();return{isLoaded:value.isLoaded,isSignedIn:value.isSignedIn,user:value.userId?{id:value.userId,fullName:value.fullName,primaryEmailAddress:value.emailAddress?{emailAddress:value.emailAddress}:null}:null};
}
const nativeControls={
 signOut:async(options?:{redirectUrl?:string})=>{
  dutyIntent.clear();await nativeClerk.signOut();if(options?.redirectUrl)window.location.assign(options.redirectUrl);
 },
 addListener:(listener:(value:{user:{id:string}|null})=>void)=>{
  const emit=()=>{const value=nativeClerk.getSnapshot();listener({user:value.userId?{id:value.userId}:null});};emit();return nativeClerk.subscribe(emit);
 },
 openUserProfile:()=>{void Browser.open({url:`${import.meta.env.VITE_API_ORIGIN}/account`}).catch(()=>{window.alert('Account security could not open. Open the RoCoEats website in your browser.');});},
};
export function useClerk(){if(usesNativeClerk())return nativeControls;return webClerk();}
export function useWebSignIn(){return usesNativeClerk()?null:webSignIn();}
export function NativeClerkProvider({children}:{children:ReactNode}){
 const value=useNativeSnapshot(),client=useQueryClient();
 useEffect(()=>{
  const remove=nativeClerk.invalidateBeforeIdentityChange(()=>client.clear());
  void nativeClerk.refresh();
  const foreground=App.addListener('appStateChange',state=>{if(state.isActive)void nativeClerk.refresh();});
  return()=>{remove();void foreground.then(handle=>handle.remove()).catch(()=>{});};
 },[client]);
 useEffect(()=>{if(!value.isLoaded)nativeStartup.report('RESTORING',!!value.error);},[value.isLoaded,value.error]);
 if(!value.isLoaded)return <main className="roco-main"><h1>Opening secure driver session</h1>{value.error?<><p role="alert">Native session could not load. Code: {value.error}.</p><button className="roco-button" onClick={()=>void nativeClerk.refresh()}>Retry session</button></>:<p role="status">Restoring native sign-in…</p>}</main>;
 return <>{value.error&&<aside className="roco-alert" role="alert">{value.error==='NATIVE_AUTH_SIGN_OUT_UNCONFIRMED'?'Local sign-out is active; provider sign-out could not be confirmed.':'Session status could not refresh.'} <button onClick={()=>{if(value.error==='NATIVE_AUTH_SIGN_OUT_UNCONFIRMED')void nativeClerk.signOut().catch(()=>{});else void nativeClerk.refresh();}}>{value.error==='NATIVE_AUTH_SIGN_OUT_UNCONFIRMED'?'Retry sign out':'Retry session'}</button></aside>}{children}</>;
}
