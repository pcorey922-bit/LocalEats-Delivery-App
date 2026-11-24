import com.rocoeats.app.NativeAuthFence;
public final class NativeAuthFenceTest {
 static void check(boolean value,String message){if(!value)throw new AssertionError(message);}
 public static void main(String[] args){
  NativeAuthFence fence=new NativeAuthFence();long first=fence.begin("request-a");
  check(fence.current(first,"request-a"),"Explicit sign-in is current");
  long second=fence.begin("request-b");
  check(!fence.current(first,"request-a"),"Late SDK result cannot activate superseded sign-in");
  check(!fence.cancel("request-a")&&fence.current(second,"request-b"),"Old route cleanup cannot cancel a newer sign-in");
  check(fence.cancel("request-b")&&!fence.current(second,"request-b"),"Cancellation blocks late SDK activation");
  long resumed=fence.begin("request-c"),tokenGeneration=fence.generation();fence.revoke();
  check(fence.generation()!=tokenGeneration&&!fence.current(resumed,"request-c"),"Logout invalidates in-flight token and ticket work");
  check(!fence.cancel(null)&&!fence.current(fence.generation(),null),"No anonymous operation can grant local intent");
  final boolean[] committed={false};
  check(!fence.commit(resumed,"request-c",()->committed[0]=true)&&!committed[0],"Canceled activation cannot clear persistent logout intent");
  long latest=fence.begin("request-d");check(fence.commit(latest,"request-d",()->committed[0]=true)&&committed[0],"Only current activation commits local intent atomically");
  System.out.println("PASS: native auth supersession/cancellation/logout fences; old callbacks cannot activate or cancel a newer session");
 }
}
