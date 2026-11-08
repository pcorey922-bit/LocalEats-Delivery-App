import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Member={id:string;displayName:string;role:"customer"|"restaurant"|"driver"|"admin";isActive:boolean};
export function AdministratorAccessManager(){
  const client=useQueryClient();
  const access=useQuery({queryKey:["administrator-owner-access"],queryFn:()=>customFetch<{superAdministrator:boolean}>("/api/session/access"),retry:false});
  const members=useQuery({queryKey:["administrator-access-members"],queryFn:()=>customFetch<Member[]>("/api/admin/profiles"),enabled:access.data?.superAdministrator===true,retry:false});
  const [id,setId]=useState(""),[reason,setReason]=useState("");
  const selected=members.data?.find(member=>member.id===id);
  const change=useMutation({mutationFn:()=>customFetch(`/api/admin/administrator-access/${id}`,{method:"PUT",body:JSON.stringify({enabled:selected?.role!=="admin",expectedRole:selected?.role,reason})}),onSuccess:async()=>{setReason("");setId("");await Promise.all([client.invalidateQueries({queryKey:["administrator-access-members"]}),client.invalidateQueries({queryKey:["/api/admin/profiles"]})]);}});
  if(!access.data?.superAdministrator)return null;
  return <section className="roco-card"><h2>Administrator permissions</h2><p>Owner only. Use dedicated staff accounts. Grants never approve a driver; configured owner accounts cannot be revoked here.</p>
    {members.isError&&<p role="alert">Account list unavailable. <button onClick={()=>void members.refetch()}>Retry</button></p>}
    <label htmlFor="administrator-account">Staff account</label><select className="roco-select" id="administrator-account" value={id} onChange={event=>{setId(event.target.value);change.reset();}}><option value="">Choose an active account</option>{members.data?.filter(member=>member.isActive&&["admin","customer"].includes(member.role)).map(member=><option key={member.id} value={member.id}>{member.displayName} · {member.role}</option>)}</select>
    <label htmlFor="administrator-reason">Reason recorded in audit log</label><textarea className="roco-textarea" id="administrator-reason" value={reason} onChange={event=>setReason(event.target.value)} minLength={10} maxLength={500}/>
    <button className="roco-button" disabled={!selected||reason.trim().length<10||change.isPending} onClick={()=>change.mutate()}>{selected?.role==="admin"?"Revoke administrator access":"Grant administrator access"}</button>
    {change.isSuccess&&<p role="status">Administrator permissions saved.</p>}{change.isError&&<p role="alert">{change.error.message}</p>}
  </section>;
}
