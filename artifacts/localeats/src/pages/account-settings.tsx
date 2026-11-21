import { useEffect, useState, type FormEvent } from "react";
import { useClerk } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGetMyDashboardQueryKey, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function AccountSettings({ displayName }: { displayName: string }) {
  const [name,setName] = useState(displayName);
  const client=useQueryClient();
  const clerk=useClerk();
  useEffect(()=>setName(displayName),[displayName]);
  const update=useMutation({
    mutationFn:()=>customFetch('/api/profiles/me',{method:'PATCH',body:JSON.stringify({displayName:name.trim(),expectedDisplayName:displayName})}),
    onSuccess:async()=>{await Promise.all([client.invalidateQueries({queryKey:getGetMyProfileQueryKey()}),client.invalidateQueries({queryKey:getGetMyDashboardQueryKey()})]);},
  });
  const submit=(event:FormEvent)=>{event.preventDefault();update.mutate();};
  return <section><h3>Account settings</h3><form onSubmit={submit}>
    <label htmlFor="profile-display-name">Display name</label>
    <input className="roco-input" id="profile-display-name" value={name} onChange={event=>setName(event.target.value)} maxLength={120} required autoComplete="nickname"/>
    <button className="roco-button" disabled={!name.trim()||update.isPending||name.trim()===displayName}>Save name</button>
    {update.isSuccess&&<p role="status">Your name has been saved.</p>}
    {update.isError&&<p role="alert">{update.error.message}</p>}
  </form><button type="button" className="roco-button" onClick={()=>clerk.openUserProfile()}>Sign-in and security settings</button>
  <p>Authentication and linked sign-in accounts are managed securely by Clerk. Account roles and approvals are verified by RoCoEats.</p></section>;
}
