import com.getcapacitor.plugin.util.DutyTrace;
import java.util.*;
public final class DutyTraceTest {
 static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 @SuppressWarnings("unchecked") static Map<String,Object> counters(Map<String,Object> report){return(Map<String,Object>)report.get("counters");}
 public static void main(String[] args){
  DutyTrace.clear();DutyTrace.Request none=DutyTrace.startRequest("https://localeats-delivery-app.onrender.com/api/driver/heartbeat","POST",1);
  DutyTrace.finish(none,DutyTrace.Stage.NATIVE_HTTP_RESULT,200,2);check(counters(DutyTrace.snapshot(3)).isEmpty(),"No collection before consented native duty");
  long owner=DutyTrace.begin(1000);
  for(String url:Arrays.asList("http://localeats-delivery-app.onrender.com/api/driver/heartbeat","https://attacker.example/api/driver/heartbeat","https://localeats-delivery-app.onrender.com/api/payments","https://localeats-delivery-app.onrender.com/api/orders"))check(DutyTrace.category(url,"POST")==DutyTrace.Kind.NONE,"Origin/path scope");
  DutyTrace.Request request=DutyTrace.startRequest("https://localeats-delivery-app.onrender.com/api/driver/heartbeat?secret=DO_NOT_LEAK","POST",1010);
  DutyTrace.end(owner,true,85000);
  DutyTrace.finish(request,DutyTrace.Stage.NATIVE_HTTP_RESULT,200,85001);
  Map<String,Object> expired=DutyTrace.snapshot(85002);
  check(expired.get("state").equals("EXPIRED")&&counters(expired).containsKey("NATIVE_HTTP_RESULT.HEARTBEAT"),"Capture native completion even after JS/watchdog stopped");
  check(expired.get("stopReason").equals("ACK_EXPIRED"),"Retain exact native acknowledgement expiry reason");
  List<?> rows=(List<?>)expired.get("events");Object startedRequest=null,finishedRequest=null;
  for(Object row:rows){Map<?,?> event=(Map<?,?>)row;if(event.get("stage").equals("NATIVE_HTTP_START"))startedRequest=event.get("request");if(event.get("stage").equals("NATIVE_HTTP_RESULT"))finishedRequest=event.get("request");}
  check(startedRequest!=null&&startedRequest.equals(finishedRequest),"Safe local request sequence correlates native start and outcome");
  check(!expired.toString().contains("DO_NOT_LEAK")&&!expired.toString().contains("https://"),"Never retain URL/query/token data");
  long next=DutyTrace.begin(90000);DutyTrace.finish(request,DutyTrace.Stage.NATIVE_HTTP_RESULT,401,90001);
  check(!counters(DutyTrace.snapshot(90002)).containsKey("NATIVE_HTTP_RESULT.HEARTBEAT"),"Old session completion is fenced");
  for(int i=0;i<1000;i++)DutyTrace.record(next,DutyTrace.Stage.PULSE,DutyTrace.Kind.HEARTBEAT,0,90000+i);
  check(((List<?>)DutyTrace.snapshot(92000).get("events")).size()==96,"Bounded event ring");
  Map<String,Object> power=new HashMap<>();power.put("ssid","DO_NOT_LEAK");power.put("transport","DO_NOT_LEAK");power.put("interactive","DO_NOT_LEAK");power.put("deviceIdle",true);power.put("wakeHeld",false);power.put("dataSaver",42);
  DutyTrace.power(next,DutyTrace.Stage.SCREEN_OFF,power,92001);
  check(!DutyTrace.snapshot(92002).toString().contains("DO_NOT_LEAK"),"Power fields strictly sanitized");
  DutyTrace.fix(next,123,92003);check(DutyTrace.snapshot(92004).get("nativeFixAgeMs").equals(123L),"Native fix receipt independent of JavaScript");
  check(DutyTrace.isJsStage(DutyTrace.Stage.JS_PULSE)&&!DutyTrace.isJsStage(DutyTrace.Stage.ACK_CONFIRMED),"JavaScript cannot claim native acknowledgements");
  DutyTrace.Request auth=DutyTrace.startRequest("https://clever-bobcat-2358.clerk.accounts.dev/v1/client/sessions/opaque/tokens","POST",93000);
  DutyTrace.authBody(auth.owner(),auth.serial(),DutyTrace.Stage.JS_BODY_START,93001);
  DutyTrace.authBody(auth.owner(),auth.serial(),DutyTrace.Stage.JS_BODY_READY,93002);
  check(counters(DutyTrace.snapshot(93003)).containsKey("JS_BODY_READY.AUTH"),"Correlate provider JSON reader without logging credentials");
  DutyTrace.authBody(auth.owner(),auth.serial(),DutyTrace.Stage.ACK_CONFIRMED,93004);
  check(!counters(DutyTrace.snapshot(93005)).containsKey("ACK_CONFIRMED.AUTH"),"Body observation cannot claim acknowledgement");
  check(DutyTrace.category("https://attacker.clerk.accounts.dev/v1/client/sessions/opaque/tokens","POST")==DutyTrace.Kind.NONE,"Only configured Clerk instance gets native reader");
  DutyTrace.clear();DutyTrace.authBody(auth.owner(),auth.serial(),DutyTrace.Stage.JS_BODY_READY,94000);
  check(counters(DutyTrace.snapshot(94001)).isEmpty(),"Late old-account body reader cannot repopulate diagnostics");
  DutyTrace.clear();check(counters(DutyTrace.snapshot(99999)).isEmpty()&&DutyTrace.snapshot(99999).get("state").equals("IDLE"),"Sign-out clears local evidence");
  System.out.println("PASS: native trace consent scope, actual HTTP completion after expiry, generation fencing, bounded memory, redaction, native fix timing, clear and source attribution");
 }
}
