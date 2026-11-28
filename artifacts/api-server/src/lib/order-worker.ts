import { processOrderTiming } from "./order-timing";
import { processReservationExpiry } from "./reservation-expiry";

export async function runOrderWorkerTick(
  stopping: () => boolean,
  progress: () => Promise<void>,
) {
  const failures: unknown[] = [];
  for (const process of [processReservationExpiry, processOrderTiming]) {
    try {
      for (let i = 0; i < 50 && !stopping(); i++) {
        if (!(await process())) break;
        // Finish useful work after an error without renewing the shared heartbeat.
        if (failures.length === 0) await progress();
      }
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Order worker phases failed");
}
