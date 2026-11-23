import com.equimaps.capacitor_background_geolocation.DutyRequestGate;
import com.equimaps.capacitor_background_geolocation.DutyLease;
public final class DutyRequestGateTest {
 static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 public static void main(String[] args){
  DutyRequestGate accepted=new DutyRequestGate(1000);
  check(accepted.complete(15999)==DutyRequestGate.Result.ACCEPT,"Within native deadline");
  check(accepted.complete(16000)==DutyRequestGate.Result.IGNORED&&!accepted.cancel(),"Exactly once even timeout race");
  DutyRequestGate late=new DutyRequestGate(1000);
  check(late.complete(16000)==DutyRequestGate.Result.TIMEOUT,"Deadline independent of paused JS timers");
  DutyRequestGate canceled=new DutyRequestGate(1000);check(canceled.cancel(),"Cancellation wins");
  check(!canceled.canStart(1001),"Canceled queued task cannot initiate HTTP");
  check(canceled.complete(1001)==DutyRequestGate.Result.IGNORED,"Late HTTP cannot ACK after cancellation");
  check(new DutyRequestGate(1000).complete(999)==DutyRequestGate.Result.TIMEOUT,"Clock rollback fails closed");
  check(DutyRequestGate.validHeartbeat(200,Boolean.TRUE),"Strict native body accepted");
  for(Object body:new Object[]{null,"true",1,Boolean.FALSE})check(!DutyRequestGate.validHeartbeat(200,body),"HTTP200 alone cannot ACK");
  check(!DutyRequestGate.validHeartbeat(401,Boolean.TRUE)&&!DutyRequestGate.validHeartbeat(500,Boolean.TRUE),"HTTP errors cannot ACK");
  // Model the native worker ACK before its JS promise is processed. The actual
  // production lease/gate run without any JS event loop or timer in this test.
  DutyLease lease=new DutyLease(0);
  for(long now=0;now<240000;now+=20000){
   long sequence=lease.pulse(now);DutyRequestGate request=new DutyRequestGate(now);
   check(request.complete(now+240)==DutyRequestGate.Result.ACCEPT,"Native response complete");
   check(DutyRequestGate.validHeartbeat(200,Boolean.TRUE)&&lease.acknowledge(sequence,now+241),"Native response validation then ACK");
   check(!lease.expired(now+19999),"Pending JS response-body reader does not own native ACK");
  }
  long sequence=lease.pulse(240000);lease.stop();
  check(!lease.acknowledge(sequence,240241),"Explicit stop cannot resurrect a request");
  System.out.println("PASS: native strict heartbeat validation, 15-second total deadline, once-only/cancel fencing and native ACK independent of JS body processing");
 }
}
