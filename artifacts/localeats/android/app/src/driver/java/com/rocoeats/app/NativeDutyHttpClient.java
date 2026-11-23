package com.rocoeats.app;

import android.os.SystemClock;
import com.equimaps.capacitor_background_geolocation.NativeDutyEngine;
import com.equimaps.capacitor_background_geolocation.DutyRequestGate;
import com.getcapacitor.plugin.util.DutyTrace;
import java.net.*;
import okhttp3.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.BooleanSupplier;
import org.json.JSONObject;

/** Native SDK credentials + bounded HTTPS telemetry; never accesses the WebView. */
public final class NativeDutyHttpClient implements NativeDutyEngine.Client {
    private final NativeClerkSession session;
    private final String origin;
    // Backend bearer requests must not inherit WebView/browser cookies.
    private final OkHttpClient http=new OkHttpClient.Builder().cookieJar(CookieJar.NO_COOKIES).followRedirects(false).followSslRedirects(false).connectTimeout(5,TimeUnit.SECONDS).readTimeout(5,TimeUnit.SECONDS).callTimeout(15,TimeUnit.SECONDS).build();
    private final ThreadPoolExecutor workers=new ThreadPoolExecutor(2,2,0,TimeUnit.SECONDS,new ArrayBlockingQueue<Runnable>(4));
    private final ScheduledExecutorService deadlines=Executors.newSingleThreadScheduledExecutor();
    public NativeDutyHttpClient(NativeClerkSession session,String origin){
        this.session=session;
        try{URI uri=new URI(origin);if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null||uri.getPath()!=null&&!uri.getPath().isEmpty()&&!uri.getPath().equals("/"))throw new IllegalArgumentException();}
        catch(Exception ignored){throw new SecurityException("NATIVE_DUTY_ORIGIN_INVALID");}
        this.origin=origin.replaceAll("/+$","");
    }
    @Override public String principal(){return session.principal();}
    private static boolean route(String path,String method){
        return "GET".equals(method)&&"/api/driver/availability".equals(path)||"POST".equals(method)&&("/api/driver/heartbeat".equals(path)||"/api/driver/location".equals(path)||path.matches("/api/driver/orders/[a-f0-9-]{36}/location"));
    }
    @Override public CompletableFuture<NativeDutyEngine.Response> request(String path,String method,Map<String,Object> body,BooleanSupplier active){
        if(!route(path,method)){CompletableFuture<NativeDutyEngine.Response> denied=new CompletableFuture<>();denied.completeExceptionally(new SecurityException("NATIVE_DUTY_ROUTE_REJECTED"));return denied;}
        Job job=new Job(path,method,body,active);
        try{job.deadline=deadlines.schedule(job::timeout,DutyRequestGate.TIMEOUT_MS,TimeUnit.MILLISECONDS);job.task=workers.submit(job);}
        catch(RejectedExecutionException ignored){job.cancel(new IOException("NATIVE_DUTY_BUSY"));}
        return job.result;
    }
    private final class Job implements Runnable {
        final String path,method,actor;final Map<String,Object> body;final BooleanSupplier active;
        final long generation,owner=DutyTrace.currentOwner(),started=SystemClock.elapsedRealtime();
        final DutyRequestGate gate=new DutyRequestGate(started);
        final CompletableFuture<NativeDutyEngine.Response> result=new CompletableFuture<>();
        final DutyTrace.Kind kind;
        volatile Future<?> task;volatile ScheduledFuture<?> deadline;volatile Call connection;
        Job(String path,String method,Map<String,Object> body,BooleanSupplier active){
            this.path=path;this.method=method;this.body=body;this.active=active;actor=session.principal();generation=session.generation();
            kind=DutyTrace.category(origin+path,method);
            result.whenComplete((value,error)->{if(result.isCancelled())cancel(new CancellationException());});
        }
        boolean allowed(){return !result.isDone()&&active.getAsBoolean()&&generation==session.generation()&&actor!=null&&actor.equals(session.principal());}
        void check() throws Exception{if(!allowed()||Thread.currentThread().isInterrupted())throw new CancellationException();if(!gate.withinDeadline(SystemClock.elapsedRealtime()))throw new TimeoutException();}
        void disconnect(){Call current=connection;if(current!=null)current.cancel();}
        void timeout(){DutyTrace.record(owner,DutyTrace.Stage.NATIVE_HTTP_TIMEOUT,kind,0,SystemClock.elapsedRealtime());cancel(new TimeoutException("NATIVE_DUTY_TIMEOUT"));}
        void cancel(Throwable cause){
            if(!gate.cancel())return;
            result.completeExceptionally(cause);
            Future<?> current=task;if(current!=null)current.cancel(true);
            disconnect();if(deadline!=null)deadline.cancel(false);
        }
        void complete(NativeDutyEngine.Response response){
            DutyRequestGate.Result terminal=gate.complete(SystemClock.elapsedRealtime());
            if(terminal==DutyRequestGate.Result.ACCEPT)result.complete(response);
            else if(terminal==DutyRequestGate.Result.TIMEOUT)result.completeExceptionally(new TimeoutException());
        }
        @Override public void run(){
            if(!gate.canStart(SystemClock.elapsedRealtime())){cancel(new TimeoutException());return;}
            try{
                NativeDutyEngine.Response response=null;
                for(int attempt=0;attempt<2;attempt++){
                    check();DutyTrace.record(owner,DutyTrace.Stage.NATIVE_TOKEN_START,kind,0,SystemClock.elapsedRealtime());
                    String token;
                    try{token=session.token(attempt==1,actor);}
                    catch(Exception error){DutyTrace.record(owner,DutyTrace.Stage.NATIVE_TOKEN_FAILED,kind,0,SystemClock.elapsedRealtime());throw error;}
                    DutyTrace.record(owner,DutyTrace.Stage.NATIVE_TOKEN_READY,kind,0,SystemClock.elapsedRealtime());check();
                    response=transmit(token);
                    // A definite401 authenticates before telemetry mutation. Force SDK
                    // renewal once; never replay ambiguous I/O,403,409 or financial writes.
                    if(response.status!=401||attempt==1)break;
                }
                check();
                complete(response);
            }catch(Exception error){
                Throwable cause=error instanceof ExecutionException&&error.getCause()!=null?error.getCause():error;
                if(cause instanceof NativeClerkSession.AuthFailure&&(((NativeClerkSession.AuthFailure)cause).status==401||((NativeClerkSession.AuthFailure)cause).status==403)){
                    complete(new NativeDutyEngine.Response(((NativeClerkSession.AuthFailure)cause).status,null));
                }else if(cause instanceof SecurityException){
                    complete(new NativeDutyEngine.Response(401,null));
                }else cancel(cause);
            }finally{disconnect();if(deadline!=null)deadline.cancel(false);}
        }
        NativeDutyEngine.Response transmit(String token) throws Exception {
            DutyTrace.Request trace=DutyTrace.startRequest(origin+path,method,SystemClock.elapsedRealtime());
            try{
                check();
                RequestBody requestBody=body==null?null:RequestBody.create(new JSONObject(body).toString().getBytes(StandardCharsets.UTF_8),MediaType.get("application/json"));
                if("POST".equals(method)&&requestBody==null)requestBody=RequestBody.create(new byte[0],MediaType.get("application/json"));
                Request request=new Request.Builder().url(origin+path).header("Accept","application/json").header("Authorization","Bearer "+token).method(method,requestBody).build();
                Call call=http.newCall(request);connection=call;call.timeout().timeout(Math.max(1,DutyRequestGate.TIMEOUT_MS-(SystemClock.elapsedRealtime()-started)),TimeUnit.MILLISECONDS);
                int status;ByteArrayOutputStream bytes=new ByteArrayOutputStream();
                try(okhttp3.Response reply=call.execute()){
                    status=reply.code();ResponseBody responseBody=reply.body();
                    if(responseBody!=null)try(InputStream input=responseBody.byteStream()){byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1){check();if(bytes.size()+count>262144)throw new IOException("NATIVE_DUTY_BODY_TOO_LARGE");bytes.write(buffer,0,count);}}
                }
                Map<String,Object> selected=new HashMap<>();
                if(bytes.size()>0){JSONObject json=new JSONObject(new String(bytes.toByteArray(),StandardCharsets.UTF_8));for(String key:new String[]{"online","approved","available","activeOrderId","accepted"})if(json.has(key))selected.put(key,json.isNull(key)?null:json.get(key));}
                DutyTrace.finish(trace,DutyTrace.Stage.NATIVE_HTTP_RESULT,status,SystemClock.elapsedRealtime());return new NativeDutyEngine.Response(status,selected);
            }catch(Exception error){DutyTrace.finish(trace,error instanceof java.net.SocketTimeoutException||error instanceof TimeoutException?DutyTrace.Stage.NATIVE_HTTP_TIMEOUT:DutyTrace.Stage.NATIVE_HTTP_ERROR,0,SystemClock.elapsedRealtime());throw error;}
            finally{disconnect();connection=null;}
        }
    }
}
