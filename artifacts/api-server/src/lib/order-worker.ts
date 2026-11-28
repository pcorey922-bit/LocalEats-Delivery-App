import { processOrderTiming } from "./order-timing";
import { processReservationExpiry, ReservationExpiryConflict } from "./reservation-expiry";

export async function runOrderWorkerTick(
  stopping: () => boolean,
  progress: () => Promise<void>,
) {
  const failures: unknown[] = [];
  const conflictedOrders: string[] = [];
  for (const process of [() => processReservationExpiry(conflictedOrders), processOrderTiming]) {
    for (let i = 0; i < 50 && !stopping(); i++) {
      try {
        if (!(await process())) break;
        // Finish useful work after an error without renewing the shared heartbeat.
        if (failures.length === 0) await progress();
      } catch (error) {
        failures.push(error);
        if (!(error instanceof ReservationExpiryConflict)) break;
        // The failed transaction has rolled back. Retry this order next tick.
        conflictedOrders.push(error.orderId);
      }
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Order worker tick failed");
}
