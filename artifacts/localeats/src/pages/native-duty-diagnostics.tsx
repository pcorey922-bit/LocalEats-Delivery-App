import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { Capacitor } from '@capacitor/core';
import { nativeDutyBridge, sanitizeDutyDiagnostics } from '../lib/native-duty-diagnostics';
import { nativeStep } from '../lib/native-startup';
export function NativeDutyDiagnostics() {
 const {userId}=useAuth();const [report,setReport]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const active=useRef<AbortController|null>(null);
 useEffect(()=>{setReport('');setMessage('');setBusy(false);return()=>{active.current?.abort();active.current=null;};},[userId]);
 if(import.meta.env.VITE_APP_AUDIENCE!=='driver'||!Capacitor.isNativePlatform()||Capacitor.getPlatform()!=='android')return null;
 const read=async()=>{
  active.current?.abort();const controller=new AbortController();active.current=controller;setBusy(true);setMessage('');setReport('');
  try{const raw=await nativeStep('NATIVE_DUTY_DIAGNOSTIC_TIMEOUT',()=>nativeDutyBridge.getDutyDiagnostics(),controller.signal);
   if(!controller.signal.aborted)setReport(JSON.stringify(sanitizeDutyDiagnostics(raw),null,2));
  }catch{if(!controller.signal.aborted)setMessage('Native diagnostics could not be read. Retry; tracking and account permissions were not changed.');}
  finally{if(active.current===controller){active.current=null;setBusy(false);}}
 };
 return <section aria-label="Screen-lock diagnostics"><h3>Screen-lock diagnostics</h3><p>Read the local report after a failure, before enabling another background session. It contains native timing, power flags and request outcomes; no credentials or locations. Evidence is lost if Android ends the app process.</p><button className="roco-button" disabled={busy} onClick={()=>void read()}>{busy?'Reading native diagnostics…':'Read screen-lock diagnostics'}</button>{report&&<><button className="roco-button" onClick={()=>{void Promise.resolve().then(()=>navigator.clipboard.writeText(report)).then(()=>setMessage('Sanitized report copied.')).catch(()=>setMessage('Select the report below to copy it manually.'));}}>Copy sanitized diagnostics</button><textarea className="roco-textarea" aria-label="Sanitized native duty report" readOnly value={report} rows={12}/></>}{message&&<p role="status">{message}</p>}</section>;
}
