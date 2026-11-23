import com.equimaps.capacitor_background_geolocation.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.BooleanSupplier;
public final class NativeDutyEngineTest {
 static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 static Map<String,Object> body(Object...pairs){Map<String,Object> map=new HashMap<>();for(int i=0;i<pairs.length;i+=2)map.put((String)pairs[i],pairs[i+1]);return map;}
 static final class Clock implements NativeDutyEngine.Clock {long now;public long monotonic(){return now;}public long wall(){return 1800000000000L+now;}}
 static final class Client implements NativeDutyEngine.Client {
  String user="approved-user";List<String> calls=new ArrayList<>();CompletableFuture<NativeDutyEngine.Response> stalled;boolean stallHeartbeat,stallLocation;Object online=Boolean.TRUE;int status=200;Object approved=Boolean.TRUE;String order;
  public String principal(){return user;}
  public CompletableFuture<NativeDutyEngine.Response> request(String path,String method,Map<String,Object> value,BooleanSupplier active){
   check(active.getAsBoolean(),"No request after local stop");calls.add(path);
   if(stallHeartbeat&&path.endsWith("/heartbeat")||stallLocation&&path.equals("/api/driver/location")){stalled=new CompletableFuture<>();return stalled;}
   Map<String,Object> response=path.endsWith("/availability")?body("approved",approved,"online",true,"available",true,"activeOrderId",order):path.endsWith("/heartbeat")?body("online",online):body("accepted",true);
   return CompletableFuture.completedFuture(new NativeDutyEngine.Response(status,response));
  }
 }
 static final class Fixture implements NativeDutyEngine.Callbacks {
  final Clock clock=new Clock();final Client client=new Client();final DutyLease lease=new DutyLease(0);
  final NativeDutyEngine engine=new NativeDutyEngine(client,"approved-user",clock,this);
  int acknowledgements,locations,heartbeats;String fatal;
  public boolean acknowledge(long sequence){boolean accepted=lease.acknowledge(sequence,clock.now);if(accepted)acknowledgements++;return accepted;}
  public void fatal(String code){fatal=code;lease.stop();}
  public void receipt(boolean location,long at){if(location)locations++;else heartbeats++;}
  public void warning(boolean location,String code){}
  void tick(long now){clock.now=now;if(lease.expired(now)){engine.stop();return;}long sequence=lease.pulse(now);if(sequence>0)engine.pulse(sequence);}
 }
 public static void main(String[] args){
  Fixture nativeOnly=new Fixture();
  // No JavaScript/event loop exists in this test. Native clock + simulated SDK/HTTP
  // sustain the REAL engine/lease through multiple ordinary token-renewal intervals.
  for(long now=0;now<=240000;now+=20000){nativeOnly.tick(now);nativeOnly.engine.location(35.8,-84.7,5,nativeOnly.clock.wall(),false);check(!nativeOnly.lease.expired(now),"Native lease survives with JS absent");}
  check(nativeOnly.acknowledgements==13&&nativeOnly.heartbeats==13&&nativeOnly.locations>=6,"Actual native ACK and accepted GPS receipts");
  nativeOnly.engine.stop();int sent=nativeOnly.client.calls.size();nativeOnly.tick(260000);nativeOnly.engine.location(35.8,-84.7,5,nativeOnly.clock.wall(),false);check(nativeOnly.client.calls.size()==sent,"Explicit stop fences native traffic");
  Fixture blocked=new Fixture();blocked.client.stallHeartbeat=true;blocked.tick(0);CompletableFuture<NativeDutyEngine.Response> late=blocked.client.stalled;blocked.tick(20000);check(blocked.client.calls.size()==1,"Pending native request cannot overlap");blocked.tick(31000);check(late.isCancelled()&&blocked.acknowledgements==0,"Unacknowledged service expires and cancels SDK wait");late.complete(new NativeDutyEngine.Response(200,body("online",true)));check(blocked.acknowledgements==0,"Late response cannot resurrect expired lease");
  Fixture timeout=new Fixture();timeout.client.stallHeartbeat=true;timeout.tick(0);timeout.client.stalled.completeExceptionally(new TimeoutException());timeout.client.stallHeartbeat=false;timeout.tick(20000);check(timeout.acknowledgements==1,"Native deadline releases request slot before watchdog expiry");
  for(Object invalid:new Object[]{"true",false,null}){Fixture bad=new Fixture();bad.client.online=invalid;bad.tick(0);check(bad.acknowledgements==0&&"DUTY_NATIVE_RESPONSE_INVALID".equals(bad.fatal),"HTTP200 alone is never an ACK");}
  for(int status:new int[]{401,403,409}){Fixture denied=new Fixture();denied.client.status=status;denied.tick(0);check(!denied.engine.active()&&denied.acknowledgements==0,"Auth/offline rejection stops native duty");}
  Fixture changed=new Fixture();changed.client.user="other-user";changed.tick(0);check(changed.client.calls.isEmpty()&&"DUTY_AUTH_CHANGED".equals(changed.fatal),"Native principal switch cannot leak requests");
  Fixture gps=new Fixture();gps.client.order="c219f42d-7fb9-4cec-9547-06025d8528f5";gps.engine.location(35.8,-84.7,5,gps.clock.wall(),true);gps.engine.location(35.8,-84.7,5,gps.clock.wall()-120001,false);check(gps.client.calls.isEmpty(),"Mock/stale GPS rejected natively");gps.client.stallLocation=true;gps.engine.location(35.8,-84.7,5,gps.clock.wall(),false);CompletableFuture<NativeDutyEngine.Response> old=gps.client.stalled;gps.tick(0);check(gps.acknowledgements==1,"Stalled GPS cannot block native heartbeat");gps.engine.stop();old.complete(new NativeDutyEngine.Response(200,body("accepted",true)));check(gps.locations==0&&gps.client.calls.stream().noneMatch(path->path.contains("/orders/")),"Late GPS after stop cannot forward to a delivery");
  Fixture revoked=new Fixture();revoked.client.approved=false;revoked.engine.location(35.8,-84.7,5,revoked.clock.wall(),false);check(revoked.client.calls.size()==1&&!revoked.engine.active(),"Server approval remains authoritative for GPS");
  System.out.println("PASS: real native duty engine+lease with NO JS for4min; SDK/HTTP simulated; stop/expiry/late/strict body/actor/approval/GPS fences and independent heartbeat");
 }
}
