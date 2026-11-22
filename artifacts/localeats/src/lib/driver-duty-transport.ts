import type { FetchRequestStage } from '../../../../lib/api-client-react/src/custom-fetch';
type Options = { method?: string; signal: AbortSignal; body?: string; headers?: HeadersInit; onStage?:(stage:FetchRequestStage)=>void };
/** Renew once only after a definite authentication rejection. Never retry unknown
 * network outcomes, permission denial, expired duty, ordering or financial writes.
 * These telemetry endpoints authenticate before their timestamp-deduplicated writes. */
export async function driverDutyRequest<T>(
  request: <V>(path:string, options:Options)=>Promise<V>,
  renew: ()=>Promise<string|null>, path:string, options:Options,
):Promise<T> {
  try { return await request<T>(path,options); }
  catch(error) {
    const method=options.method??'GET';
    const allowed=method==='GET' && path==='/api/driver/availability' || method==='POST' &&
      (path==='/api/driver/heartbeat' || path==='/api/driver/location' || /^\/api\/driver\/orders\/[a-f0-9-]+\/location$/.test(path));
    if ((error as {status?:number})?.status!==401 || !allowed) throw error;
    options.signal.throwIfAborted();
    const stage=(value:FetchRequestStage)=>{try{options.onStage?.(value);}catch{}};
    stage('TOKEN_START');
    let token:string|null;
    try{token=await renew();stage('TOKEN_READY');}catch(error){stage('TOKEN_FAILED');throw error;}
    options.signal.throwIfAborted();
    if(!token)throw error;
    const headers=new Headers(options.headers);headers.set('Authorization',`Bearer ${token}`);
    return request<T>(path,{...options,headers});
  }
}
