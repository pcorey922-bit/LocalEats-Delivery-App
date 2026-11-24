package com.rocoeats.app;

import android.content.Intent;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.*;

/** Explicit native session bridge. No provider response/error text is logged. */
@CapacitorPlugin(name="RoCoEatsNativeClerk")
public class NativeClerkPlugin extends Plugin {
    private static NativeDutyHttpClient dutyClient;
    private final ExecutorService requests=new ThreadPoolExecutor(2,2,0,TimeUnit.SECONDS,new ArrayBlockingQueue<Runnable>(8));
    private NativeClerkSession session(){return NativeClerkSession.get(getContext());}
    private interface Operation {JSObject run() throws Exception;}
    private void request(PluginCall call,Operation operation){
        CompletableFuture<Void> configured=new CompletableFuture<>();
        getActivity().runOnUiThread(()->{try{session().configure(getActivity());
            synchronized(NativeClerkPlugin.class){if(dutyClient==null)dutyClient=new NativeDutyHttpClient(session(),BuildConfig.ROCOEATS_API_ORIGIN);com.equimaps.capacitor_background_geolocation.NativeDutyRuntime.install(dutyClient);}
            configured.complete(null);}catch(Exception ignored){configured.completeExceptionally(new SecurityException("NATIVE_AUTH_CONFIG_MISSING"));}});
        try{requests.submit(()->{try{configured.get(12000,TimeUnit.MILLISECONDS);session().awaitInitialized();call.resolve(operation.run());}catch(Exception error){
            Throwable cause=error instanceof ExecutionException&&error.getCause()!=null?error.getCause():error;
            String code=cause instanceof NativeClerkSession.AuthFailure&&(((NativeClerkSession.AuthFailure)cause).status==401||((NativeClerkSession.AuthFailure)cause).status==403)?"NATIVE_AUTH_REQUIRED":cause instanceof SecurityException&&cause.getMessage()!=null&&cause.getMessage().matches("NATIVE_[A-Z_]+")?cause.getMessage():"NATIVE_AUTH_REQUEST_FAILED";
            call.reject("Native authentication did not complete",code);
        }});}
        catch(RejectedExecutionException ignored){call.reject("Native authentication unavailable","NATIVE_AUTH_UNAVAILABLE");}
    }
    @PluginMethod public void getState(PluginCall call){if(session().isLocallySignedOut())call.resolve(session().state());else request(call,()->session().state());}
    @PluginMethod public void getToken(PluginCall call){request(call,()->new JSObject().put("token",session().token(call.getBoolean("skipCache",false),call.getString("expectedPrincipal"))));}
    @PluginMethod public void signInWithTicket(PluginCall call){
        String requestId=call.getString("requestId","");
        if(!requestId.matches("[a-f0-9-]{36}")){call.reject("Invalid native sign-in handle","NATIVE_AUTH_REQUEST_INVALID");return;}
        getContext().stopService(new Intent(getContext(),com.equimaps.capacitor_background_geolocation.BackgroundGeolocationService.class));
        long owner=session().beginSignIn(requestId);
        request(call,()->session().signIn(call.getString("ticket"),requestId,owner));
    }
    @PluginMethod public void cancelAuthRequest(PluginCall call){session().cancelSignIn(call.getString("requestId"));call.resolve();}
    @PluginMethod public void signOut(PluginCall call){
        getContext().stopService(new Intent(getContext(),com.equimaps.capacitor_background_geolocation.BackgroundGeolocationService.class));
        long owner=session().revokeLocalIntent();
        request(call,()->{session().signOut(owner);return session().state();});
    }
    @Override protected void handleOnDestroy(){requests.shutdownNow();super.handleOnDestroy();}
}
