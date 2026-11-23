package com.rocoeats.app;

/** Process-local operation fence, never an authentication or role assertion. */
public final class NativeAuthFence {
    private long generation;
    private String pending;
    public synchronized long generation(){return generation;}
    public synchronized long begin(String requestId){pending=requestId;return ++generation;}
    public synchronized boolean current(long owner,String requestId){return owner==generation&&requestId!=null&&requestId.equals(pending);}
    public synchronized boolean cancel(String requestId){
        if(requestId==null||!requestId.equals(pending))return false;
        revoke();return true;
    }
    public synchronized void revoke(){pending=null;generation++;}
}
