package com.rocoeats.app;

import android.content.Context;
import android.content.SharedPreferences;
import com.clerk.api.Clerk;
import com.clerk.api.network.model.error.ClerkErrorResponse;
import com.clerk.api.network.serialization.ClerkResult;
import com.clerk.api.session.GetTokenOptions;
import com.clerk.api.session.Session;
import com.clerk.api.signin.SignIn;
import com.clerk.api.user.User;
import com.getcapacitor.JSObject;
import java.util.concurrent.*;
import kotlin.ResultKt;
import kotlin.coroutines.Continuation;
import kotlin.coroutines.CoroutineContext;
import kotlin.coroutines.intrinsics.IntrinsicsKt;
import kotlinx.coroutines.CompletableJob;
import kotlinx.coroutines.Dispatchers;
import kotlinx.coroutines.Job;
import kotlinx.coroutines.JobKt;

/** Official native SDK owns credentials and renewal. Never copies WebView state. */
public final class NativeClerkSession {
    private static volatile NativeClerkSession instance;
    private final SharedPreferences intent;
    private final NativeAuthFence fence = new NativeAuthFence();
    private final Object initialization = new Object();
    private volatile boolean configured;
    private NativeClerkSession(Context context) {
        intent=context.getApplicationContext().getSharedPreferences("rocoeats-native-auth-intent",Context.MODE_PRIVATE);
    }
    public static synchronized NativeClerkSession get(Context context) {
        if(instance==null)instance=new NativeClerkSession(context);
        return instance;
    }
    public void configure(Context context) {
        synchronized(initialization){
            if(!configured){
                if(BuildConfig.ROCOEATS_CLERK_KEY.isEmpty())throw new SecurityException("NATIVE_AUTH_CONFIG_MISSING");
                Clerk.INSTANCE.initialize(context,BuildConfig.ROCOEATS_CLERK_KEY);
                configured=true;
            }
        }
    }
    public void awaitInitialized() throws Exception {
        long deadline=android.os.SystemClock.elapsedRealtime()+12000;
        while(!configured||!Clerk.INSTANCE.isInitialized().getValue()){
            if(Thread.currentThread().isInterrupted()||android.os.SystemClock.elapsedRealtime()>=deadline)throw new TimeoutException("NATIVE_AUTH_INIT_TIMEOUT");
            Thread.sleep(50);
        }
    }
    public boolean isLocallySignedOut(){return locallySignedOut();}
    private boolean locallySignedOut(){return intent.getBoolean("explicit-sign-out",false);}
    public String principal(){
        if(!configured||!Clerk.INSTANCE.isInitialized().getValue()||locallySignedOut())return null;
        Session session=Clerk.INSTANCE.getSession();User user=Clerk.INSTANCE.getUser();
        return session!=null&&session.getStatus()==Session.SessionStatus.ACTIVE&&session.getCurrentTask()==null&&session.getTasks().isEmpty()&&user!=null&&session.getUser()!=null&&user.getId().equals(session.getUser().getId())?user.getId():null;
    }
    public String sessionId(){return principal()==null?null:Clerk.INSTANCE.getSession().getId();}
    public JSObject state(){
        JSObject result=new JSObject();String userId=principal();
        result.put("isLoaded",true);result.put("isSignedIn",userId!=null);
        if(userId!=null){
            User user=Clerk.INSTANCE.getUser();result.put("userId",userId);result.put("sessionId",sessionId());
            String first=user.getFirstName()==null?"":user.getFirstName(),last=user.getLastName()==null?"":user.getLastName();
            result.put("fullName",(first+" "+last).trim());
            if(user.getPrimaryEmailAddress()!=null)result.put("emailAddress",user.getPrimaryEmailAddress().getEmailAddress());
        }
        return result;
    }
    public long generation(){return fence.generation();}
    public static final class AuthFailure extends Exception {
        public final int status;
        AuthFailure(int status){super("NATIVE_AUTH_PROVIDER_UNAVAILABLE");this.status=status;}
    }
    private interface SuspendCall<T>{Object invoke(Continuation<? super ClerkResult<T,ClerkErrorResponse>> continuation);}
    @SuppressWarnings("unchecked")
    private static <T> CompletableFuture<T> nativeCall(SuspendCall<T> call){
        CompletableFuture<T> result=new CompletableFuture<>();
        CompletableJob job=JobKt.Job((Job)null);
        Continuation<ClerkResult<T,ClerkErrorResponse>> continuation=new Continuation<ClerkResult<T,ClerkErrorResponse>>(){
            @Override public CoroutineContext getContext(){return job.plus(Dispatchers.getIO());}
            @Override public void resumeWith(Object outcome){
                try{
                    ResultKt.throwOnFailure(outcome);
                    if(outcome instanceof ClerkResult.Success<?>)result.complete((T)((ClerkResult.Success<?>)outcome).getValue());
                    else if(outcome instanceof ClerkResult.Failure<?>){
                        Integer code=((ClerkResult.Failure<?>)outcome).getCode();
                        result.completeExceptionally(new AuthFailure(code!=null&&code>=400&&code<=599?code:503));
                    }else result.completeExceptionally(new AuthFailure(503));
                }catch(Throwable ignored){result.completeExceptionally(new AuthFailure(503));}
            }
        };
        result.whenComplete((value,error)->{if(result.isCancelled())job.cancel(new CancellationException("Native authentication canceled"));});
        try{Object immediate=call.invoke(continuation);if(immediate!=IntrinsicsKt.getCOROUTINE_SUSPENDED())continuation.resumeWith(immediate);}
        catch(Throwable ignored){result.completeExceptionally(new AuthFailure(503));}
        return result;
    }
    private static <T> T bounded(CompletableFuture<T> pending,long milliseconds) throws Exception {
        try{return pending.get(milliseconds,TimeUnit.MILLISECONDS);}
        catch(Exception failure){pending.cancel(true);throw failure;}
    }
    public String token(boolean force,String expectedPrincipal) throws Exception {
        String userId=principal(),session=sessionId();long owner=fence.generation();
        if(userId==null||expectedPrincipal!=null&&!expectedPrincipal.equals(userId))throw new SecurityException("NATIVE_AUTH_REQUIRED");
        String token;
        try{token=bounded(nativeCall(continuation->Clerk.INSTANCE.getAuth().getToken(force?new GetTokenOptions(null,true,10L):new GetTokenOptions(),continuation)),8000);}
        catch(Exception error){
            if(fence.generation()!=owner)throw new SecurityException("NATIVE_AUTH_CHANGED");
            Throwable cause=error instanceof ExecutionException&&error.getCause()!=null?error.getCause():error;
            if(cause instanceof AuthFailure&&(((AuthFailure)cause).status==401||((AuthFailure)cause).status==403))revokeLocalIntent();
            throw error;
        }
        if(fence.generation()!=owner||!userId.equals(principal())||!session.equals(sessionId())||token==null||token.isEmpty())throw new SecurityException("NATIVE_AUTH_CHANGED");
        return token;
    }
    public long beginSignIn(String requestId) {
        synchronized(fence){long owner=fence.begin(requestId);
        intent.edit().putBoolean("explicit-sign-out",true).commit();return owner;}
    }
    public void cancelSignIn(String requestId) {
        synchronized(fence){if(fence.cancel(requestId))intent.edit().putBoolean("explicit-sign-out",true).commit();}
    }
    public long revokeLocalIntent(){synchronized(fence){fence.revoke();intent.edit().putBoolean("explicit-sign-out",true).commit();return fence.generation();}}
    private void checkSignIn(long owner,String requestId,long deadline) throws Exception {
        if(!fence.current(owner,requestId)||Thread.currentThread().isInterrupted())throw new CancellationException("Native sign-in canceled");
        if(android.os.SystemClock.elapsedRealtime()>=deadline)throw new TimeoutException("NATIVE_TICKET_TIMEOUT");
    }
    public synchronized JSObject signIn(String ticket,String requestId,long owner) throws Exception {
        if(ticket==null||ticket.length()<8||ticket.length()>8192)throw new SecurityException("NATIVE_TICKET_INVALID");
        long deadline=android.os.SystemClock.elapsedRealtime()+12000;
        checkSignIn(owner,requestId,deadline);
        SignIn signIn=bounded(nativeCall(continuation->Clerk.INSTANCE.getAuth().signInWithTicket(ticket,continuation)),Math.max(1,deadline-android.os.SystemClock.elapsedRealtime()));
        checkSignIn(owner,requestId,deadline);
        if(signIn.getStatus()!=SignIn.Status.COMPLETE||signIn.getCreatedSessionId()==null)throw new SecurityException("NATIVE_SESSION_TASK_REQUIRED");
        Session activated=bounded(nativeCall(continuation->Clerk.INSTANCE.getAuth().setActive(signIn.getCreatedSessionId(),null,continuation)),Math.max(1,deadline-android.os.SystemClock.elapsedRealtime()));
        checkSignIn(owner,requestId,deadline);
        if(fence.generation()!=owner||activated.getStatus()!=Session.SessionStatus.ACTIVE||activated.getCurrentTask()!=null||!activated.getTasks().isEmpty())throw new SecurityException("NATIVE_SESSION_TASK_REQUIRED");
        if(!fence.commit(owner,requestId,()->intent.edit().putBoolean("explicit-sign-out",false).commit()))throw new CancellationException("Native sign-in canceled");
        if(principal()==null)throw new SecurityException("NATIVE_ACTIVATION_UNCONFIRMED");
        return state();
    }
    public synchronized void signOut(long owner) throws Exception {
        // Persistent noncredential intent prevents an offline/failed provider sign-out
        // from silently restoring the old SDK session after process restart.
        if(fence.generation()!=owner)return; // A queued old logout cannot revoke a newer explicit login.
        bounded(NativeClerkSession.<kotlin.Unit>nativeCall(continuation->Clerk.INSTANCE.getAuth().signOut(null,continuation)),8000);
    }
}
