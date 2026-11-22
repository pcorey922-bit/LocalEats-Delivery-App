import com.equimaps.capacitor_background_geolocation.DutyLease;
public final class DutyLeaseTest {
    static void check(boolean value, String message) { if (!value) throw new AssertionError(message); }
    public static void main(String[] args) {
        DutyLease fresh = new DutyLease(1000);
        check(!fresh.expired(30999) && fresh.expired(31000), "No-ack service must stop after initial grace");
        DutyLease lease = new DutyLease(1000);
        long sequence = lease.pulse(1000);
        check(sequence > 0 && lease.pulse(1001) == 0, "Pulse throttle");
        check(!lease.acknowledge(sequence+1, 2000), "Unknown challenge cannot extend lease");
        check(lease.pulse(21000) == sequence, "Pending challenge is stable during delayed request");
        check(lease.acknowledge(sequence, 22000), "Actual heartbeat acknowledgement");
        check(!lease.acknowledge(sequence, 23000), "Duplicate acknowledgement rejected");
        check(!lease.expired(75999) && lease.expired(76000), "Expiry anchored to ISSUE, not receipt");
        check(!lease.acknowledge(sequence, 76000), "Expired session cannot resurrect");
        DutyLease continuous = new DutyLease(0);
        for (long now=0; now<=240000; now+=20000) {
            long pulse=continuous.pulse(now);
            check(pulse>0 && continuous.acknowledge(pulse,now+1000), "Native clock independent of GPS");
            check(!continuous.expired(now+19999), "Acknowledged on-duty session remains alive");
        }
        long next=continuous.pulse(260000);
        continuous.stop();
        check(continuous.expired(260001) && continuous.pulse(280000)==0 && !continuous.acknowledge(next,260002), "Explicit stop is permanent");
        DutyLease rollback=new DutyLease(1000);
        check(rollback.expired(999), "Monotonic rollback fails closed");
        System.out.println("PASS: native initial/ack expiry, challenge/duplicate/late fencing, issue-time baseline, 4-minute GPS-independent pulses, stop and monotonic clock safety");
    }
}
